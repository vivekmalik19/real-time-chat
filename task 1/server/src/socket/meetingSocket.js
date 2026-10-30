import { Server } from 'socket.io';
import { verifyAuthToken } from '../utils/jwt.js';

// Mesh topology limit: Mesh bandwidth scales as O(N) upload per peer and O(N^2) total traffic.
// Mesh is optimal for small groups (2-6 peers). For larger meetings an SFU is required.
export const MAX_ROOM_PARTICIPANTS = parseInt(process.env.MAX_ROOM_PARTICIPANTS || '6', 10);

// File transfer limits
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const DISALLOWED_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.scr',
  '.vbs',
  '.msi',
  '.apk',
  '.jar',
];

/**
 * Returns ICE servers configured for the deployment
 * Uses public STUN by default and injects TURN if provided in env
 */
export function getIceServers() {
  const iceServers = [
    {
      urls: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
        'stun:stun2.l.google.com:19302',
      ],
    },
  ];

  if (process.env.TURN_SERVER_URL) {
    const turnUrls = process.env.TURN_SERVER_URL.split(',').map((u) => u.trim());
    const turnConfig = {
      urls: turnUrls,
    };
    if (process.env.TURN_USERNAME) {
      turnConfig.username = process.env.TURN_USERNAME;
    }
    if (process.env.TURN_CREDENTIAL) {
      turnConfig.credential = process.env.TURN_CREDENTIAL;
    }
    iceServers.push(turnConfig);
  }

  return iceServers;
}

// In-memory room registry: roomId -> RoomState
const activeRooms = new Map();

/**
 * Room State Model
 * {
 *   roomId: string,
 *   hostSocketId: string,
 *   isLocked: boolean,
 *   chatEnabled: boolean,
 *   screenShareEnabled: boolean,
 *   createdAt: Date,
 *   participants: Map<socketId, {
 *     socketId: string,
 *     userId: string|null,
 *     name: string,
 *     avatar: string|null,
 *     isHost: boolean,
 *     isCoHost: boolean,
 *     micOn: boolean,
 *     camOn: boolean,
 *     handRaised: boolean,
 *     joinedAt: Date
 *   }>
 * }
 */

export function initMeetingSocket(httpServer, allowedOrigins = []) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow local dev and configured clients
        callback(null, true);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  io.on('connection', (socket) => {
    let currentRoomId = null;

    // Track rate limit per socket (max 100 signaling events / 10s)
    let messageCount = 0;
    const rateLimitTimer = setInterval(() => {
      messageCount = 0;
    }, 10000);

    function isRateLimited() {
      messageCount++;
      return messageCount > 100;
    }

    /**
     * 1. JOIN ROOM
     */
    socket.on('join-room', ({ roomId, token, name = 'Guest User', avatar = null, micOn = true, camOn = true }, callback) => {
      try {
        if (!roomId || typeof roomId !== 'string' || roomId.trim().length < 2) {
          if (callback) callback({ success: false, message: 'Invalid Room ID' });
          return;
        }

        const cleanRoomId = roomId.trim().toLowerCase();

        // Optional JWT verification for authenticated users
        let verifiedUserId = null;
        let verifiedName = name;
        if (token) {
          try {
            const decoded = verifyAuthToken(token);
            verifiedUserId = decoded.userId;
          } catch {
            // Guest fallback
          }
        }

        // Get or create room
        let room = activeRooms.get(cleanRoomId);
        const isFirstUser = !room || room.participants.size === 0;

        if (!room) {
          room = {
            roomId: cleanRoomId,
            hostSocketId: socket.id,
            isLocked: false,
            chatEnabled: true,
            screenShareEnabled: true,
            createdAt: new Date(),
            participants: new Map(),
          };
          activeRooms.set(cleanRoomId, room);
        } else {
          // Check room lock
          if (room.isLocked) {
            if (callback) {
              callback({
                success: false,
                code: 'ROOM_LOCKED',
                message: 'This meeting is locked by the host. New participants cannot join.',
              });
            }
            return;
          }

          // Check participant limit (Mesh scalability constraint)
          if (room.participants.size >= MAX_ROOM_PARTICIPANTS) {
            if (callback) {
              callback({
                success: false,
                code: 'ROOM_FULL',
                message: `This meeting has reached the small-group mesh limit of ${MAX_ROOM_PARTICIPANTS} participants.`,
              });
            }
            return;
          }
        }

        const participantData = {
          socketId: socket.id,
          userId: verifiedUserId,
          name: verifiedName.slice(0, 50),
          avatar,
          isHost: isFirstUser,
          isCoHost: false,
          micOn: Boolean(micOn),
          camOn: Boolean(camOn),
          handRaised: false,
          joinedAt: new Date(),
        };

        room.participants.set(socket.id, participantData);
        currentRoomId = cleanRoomId;
        socket.join(cleanRoomId);

        // Build list of existing participants in the room (excluding this new participant)
        const existingParticipants = [];
        room.participants.forEach((p, sId) => {
          if (sId !== socket.id) {
            existingParticipants.push(p);
          }
        });

        // Acknowledge joining to the newly connected peer
        if (callback) {
          callback({
            success: true,
            roomId: cleanRoomId,
            isHost: isFirstUser,
            isCoHost: false,
            iceServers: getIceServers(),
            maxParticipants: MAX_ROOM_PARTICIPANTS,
            settings: {
              isLocked: room.isLocked,
              chatEnabled: room.chatEnabled,
              screenShareEnabled: room.screenShareEnabled,
            },
            existingParticipants,
            self: participantData,
          });
        }

        // Broadcast to all existing peers in the room that a new user joined
        socket.to(cleanRoomId).emit('user-joined', {
          participant: participantData,
        });

        console.log(`[Socket] User '${verifiedName}' (${socket.id}) joined room '${cleanRoomId}'. Total: ${room.participants.size}`);
      } catch (err) {
        console.error('[Socket] join-room error:', err);
        if (callback) callback({ success: false, message: 'Server error joining meeting' });
      }
    });

    /**
     * 2. WEBRTC SIGNALING (Offer, Answer, ICE Candidate)
     * Directed exchange between two peer sockets
     */
    socket.on('signal', ({ to, signal }) => {
      if (isRateLimited()) return;
      if (!to || !signal) return;

      const room = activeRooms.get(currentRoomId);
      if (!room || !room.participants.has(to)) {
        return; // Target peer is no longer in this room
      }

      // Relay signal to target peer
      io.to(to).emit('signal', {
        from: socket.id,
        signal,
      });
    });

    /**
     * 3. MEDIA STATUS TOGGLE (Mic / Camera)
     */
    socket.on('toggle-media', ({ micOn, camOn }) => {
      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (participant) {
        if (typeof micOn === 'boolean') participant.micOn = micOn;
        if (typeof camOn === 'boolean') participant.camOn = camOn;

        // Broadcast to peers in room
        socket.to(currentRoomId).emit('user-media-toggled', {
          socketId: socket.id,
          micOn: participant.micOn,
          camOn: participant.camOn,
        });
      }
    });

    /**
     * 4. RAISE / LOWER HAND
     */
    socket.on('raise-hand', ({ handRaised }) => {
      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (participant) {
        participant.handRaised = Boolean(handRaised);
        io.to(currentRoomId).emit('user-hand-toggled', {
          socketId: socket.id,
          handRaised: participant.handRaised,
          name: participant.name,
        });
      }
    });

    /**
     * 5. IN-CALL CHAT & FILE SHARING
     */
    socket.on('chat-message', ({ text = '', emoji = null, file = null }, callback) => {
      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      // Check room chat permissions
      if (!room.chatEnabled && !participant.isHost && !participant.isCoHost) {
        if (callback) callback({ success: false, message: 'Chat is currently disabled by the host.' });
        return;
      }

      // File validation if attachment included
      let validatedFile = null;
      if (file) {
        const { name: fileName, size: fileSize, data: fileData, type: fileType } = file;
        if (fileSize > MAX_FILE_SIZE_BYTES) {
          if (callback) callback({ success: false, message: 'File exceeds maximum limit of 10MB.' });
          return;
        }

        const ext = fileName ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
        if (DISALLOWED_EXTENSIONS.includes(ext)) {
          if (callback) callback({ success: false, message: 'Executable file types are prohibited for security.' });
          return;
        }

        validatedFile = {
          name: fileName,
          size: fileSize,
          type: fileType,
          data: fileData, // Base64 or data URL
        };
      }

      const messagePayload = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        senderSocketId: socket.id,
        senderName: participant.name,
        senderAvatar: participant.avatar,
        text: (text || '').slice(0, 1000),
        emoji,
        file: validatedFile,
        timestamp: new Date().toISOString(),
      };

      io.to(currentRoomId).emit('chat-message', messagePayload);
      if (callback) callback({ success: true, messageId: messagePayload.id });
    });

    /**
     * 6. HOST MODERATION ACTIONS
     */
    socket.on('host-action', ({ action, targetSocketId, enabled, isCoHost }, callback) => {
      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const actor = room.participants.get(socket.id);
      if (!actor || (!actor.isHost && !actor.isCoHost)) {
        if (callback) callback({ success: false, message: 'Only hosts and co-hosts can perform moderation actions.' });
        return;
      }

      if (action === 'mute-request') {
        // Send mute request to participant (browser hardware cannot be forcibly muted remotely)
        if (targetSocketId && room.participants.has(targetSocketId)) {
          io.to(targetSocketId).emit('host-mute-request', {
            requestedBy: actor.name,
          });
          if (callback) callback({ success: true });
        }
      } else if (action === 'remove-participant') {
        // Only host can kick co-hosts or participants
        if (targetSocketId && room.participants.has(targetSocketId)) {
          const target = room.participants.get(targetSocketId);
          if (target.isHost) {
            if (callback) callback({ success: false, message: 'Cannot remove the primary host.' });
            return;
          }

          io.to(targetSocketId).emit('removed-from-room', {
            reason: 'You were removed from the meeting by a host.',
          });

          // Disconnect target socket from room
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            targetSocket.leave(currentRoomId);
          }
          room.participants.delete(targetSocketId);

          // Broadcast to remaining room members
          io.to(currentRoomId).emit('user-left', {
            socketId: targetSocketId,
            name: target.name,
            reason: 'removed',
          });

          if (callback) callback({ success: true });
        }
      } else if (action === 'lock-meeting') {
        room.isLocked = Boolean(enabled);
        io.to(currentRoomId).emit('meeting-lock-toggled', {
          isLocked: room.isLocked,
          lockedBy: actor.name,
        });
        if (callback) callback({ success: true, isLocked: room.isLocked });
      } else if (action === 'toggle-permission') {
        // e.g. chat or screenShare
        if (action === 'chat') room.chatEnabled = Boolean(enabled);
        if (action === 'screenShare') room.screenShareEnabled = Boolean(enabled);

        io.to(currentRoomId).emit('permission-toggled', {
          chatEnabled: room.chatEnabled,
          screenShareEnabled: room.screenShareEnabled,
        });
        if (callback) callback({ success: true });
      } else if (action === 'assign-cohost') {
        if (!actor.isHost) {
          if (callback) callback({ success: false, message: 'Only the meeting host can assign co-hosts.' });
          return;
        }

        const target = room.participants.get(targetSocketId);
        if (target) {
          target.isCoHost = Boolean(isCoHost);
          io.to(currentRoomId).emit('cohost-toggled', {
            socketId: targetSocketId,
            isCoHost: target.isCoHost,
            name: target.name,
          });
          if (callback) callback({ success: true });
        }
      } else if (action === 'end-meeting') {
        if (!actor.isHost) {
          if (callback) callback({ success: false, message: 'Only the meeting host can end the meeting for everyone.' });
          return;
        }

        io.to(currentRoomId).emit('meeting-ended', {
          reason: 'The meeting was ended by the host.',
        });

        // Clean up all sockets and delete room
        activeRooms.delete(currentRoomId);
        if (callback) callback({ success: true });
      }
    });

    /**
     * 7. RECORDING STATUS BROADCAST (Consent Awareness)
     */
    socket.on('recording-status', ({ isRecording }) => {
      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const actor = room.participants.get(socket.id);
      if (!actor || (!actor.isHost && !actor.isCoHost)) return;

      io.to(currentRoomId).emit('recording-status', {
        isRecording: Boolean(isRecording),
        hostName: actor.name,
      });
    });

    /**
     * 8. LEAVE ROOM / DISCONNECT CLEANUP
     */
    function handleLeave() {
      clearInterval(rateLimitTimer);
      if (!currentRoomId) return;

      const room = activeRooms.get(currentRoomId);
      if (!room) return;

      const leavingUser = room.participants.get(socket.id);
      room.participants.delete(socket.id);
      socket.leave(currentRoomId);

      if (leavingUser) {
        console.log(`[Socket] User '${leavingUser.name}' left room '${currentRoomId}'. Remaining: ${room.participants.size}`);

        // Broadcast to remaining room members
        io.to(currentRoomId).emit('user-left', {
          socketId: socket.id,
          name: leavingUser.name,
        });

        // Host succession if host leaves and other participants remain
        if (leavingUser.isHost && room.participants.size > 0) {
          // Elect first co-host or oldest participant
          let newHostSocketId = null;
          room.participants.forEach((p, sId) => {
            if (!newHostSocketId && p.isCoHost) newHostSocketId = sId;
          });
          if (!newHostSocketId) {
            newHostSocketId = room.participants.keys().next().value;
          }

          if (newHostSocketId) {
            const newHost = room.participants.get(newHostSocketId);
            newHost.isHost = true;
            room.hostSocketId = newHostSocketId;

            io.to(currentRoomId).emit('host-changed', {
              newHostSocketId,
              name: newHost.name,
            });
          }
        }
      }

      // If room is now empty, delete it
      if (room.participants.size === 0) {
        activeRooms.delete(currentRoomId);
        console.log(`[Socket] Room '${currentRoomId}' is now empty and was removed.`);
      }

      currentRoomId = null;
    }

    socket.on('leave-room', handleLeave);
    socket.on('disconnect', handleLeave);
  });

  return io;
}
