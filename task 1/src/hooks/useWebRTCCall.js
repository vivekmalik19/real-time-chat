import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SIGNALING_SERVER_URL = 'http://localhost:5001';

// Default public STUN servers
const DEFAULT_ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
];

export default function useWebRTCCall({
  roomId,
  localStream,
  isCamOn,
  isMicOn,
  user,
}) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isCoHost, setIsCoHost] = useState(false);
  const [peers, setPeers] = useState([]); // array of remote peer objects
  const [roomSettings, setRoomSettings] = useState({
    isLocked: false,
    chatEnabled: true,
    screenShareEnabled: true,
  });

  // Screen share state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const screenTrackRef = useRef(null);

  // In-call chat & notifications
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Hand raised state
  const [handRaised, setHandRaised] = useState(false);

  // Active speaking states
  const [localSpeaking, setLocalSpeaking] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingHostName, setRecordingHostName] = useState(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  // Toast / System notification callback
  const [systemNotice, setSystemNotice] = useState(null);

  // WebRTC Peer Connections Map: socketId -> RTCPeerConnection
  const peerConnectionsRef = useRef(new Map());
  // Remote Streams Map: socketId -> MediaStream
  const remoteStreamsRef = useRef(new Map());
  // ICE candidate queue for candidates arriving before remote description is set
  const candidateQueuesRef = useRef(new Map());

  // ICE servers from server
  const iceServersRef = useRef(DEFAULT_ICE_SERVERS);

  // Local muted peers map (client-side local mute)
  const [locallyMutedPeers, setLocallyMutedPeers] = useState(new Set());

  // Audio Context and analyser for active speaker detection
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  /**
   * 1. Initialize Socket.IO and Join Room
   */
  useEffect(() => {
    if (!roomId) return;

    const token = localStorage.getItem('meetflow_token');
    const newSocket = io(SIGNALING_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('[WebRTC Socket] Connected with ID:', newSocket.id);

      // Join room
      newSocket.emit(
        'join-room',
        {
          roomId,
          token,
          name: user?.name || 'Guest User',
          avatar: user?.avatar || null,
          micOn: isMicOn,
          camOn: isCamOn,
        },
        (res) => {
          if (!res.success) {
            setSystemNotice({
              type: 'error',
              message: res.message || 'Unable to join meeting room.',
              code: res.code,
            });
            return;
          }

          setIsHost(res.isHost);
          setIsCoHost(res.isCoHost);
          if (res.iceServers && res.iceServers.length > 0) {
            iceServersRef.current = res.iceServers;
          }
          if (res.settings) {
            setRoomSettings(res.settings);
          }

          console.log('[WebRTC Socket] Successfully joined room:', roomId, 'isHost:', res.isHost);

          // If there are existing participants, create peer connections and initiate offers
          if (res.existingParticipants && res.existingParticipants.length > 0) {
            res.existingParticipants.forEach((existingPeer) => {
              createPeerConnection(existingPeer.socketId, true, existingPeer, newSocket);
            });
          }
        }
      );
    });

    // 2. Handle when another user joins
    newSocket.on('user-joined', ({ participant }) => {
      console.log('[WebRTC Socket] New user joined:', participant.name, participant.socketId);
      setSystemNotice({
        type: 'info',
        message: `${participant.name} joined the meeting.`,
      });

      // Prepare peer connection receiver side (wait for their offer)
      createPeerConnection(participant.socketId, false, participant, newSocket);
    });

    // 3. Handle WebRTC signals (offer, answer, ice-candidate)
    newSocket.on('signal', async ({ from, signal }) => {
      try {
        let pc = peerConnectionsRef.current.get(from);

        if (signal.type === 'offer') {
          // If we don't have a peer connection yet, create it as answerer
          if (!pc) {
            pc = createPeerConnection(from, false, null, newSocket);
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal));

          // Drain queued ICE candidates
          const queue = candidateQueuesRef.current.get(from) || [];
          for (const cand of queue) {
            await pc.addIceCandidate(cand).catch((e) => console.warn('[WebRTC] Queue ICE candidate err:', e));
          }
          candidateQueuesRef.current.set(from, []);

          // Create answer
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          newSocket.emit('signal', { to: from, signal: answer });
        } else if (signal.type === 'answer') {
          if (pc && pc.signalingState !== 'stable') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));

            // Drain queued ICE candidates
            const queue = candidateQueuesRef.current.get(from) || [];
            for (const cand of queue) {
              await pc.addIceCandidate(cand).catch((e) => console.warn('[WebRTC] Queue ICE candidate err:', e));
            }
            candidateQueuesRef.current.set(from, []);
          }
        } else if (signal.candidate) {
          const candidate = new RTCIceCandidate(signal);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(candidate).catch((e) => console.warn('[WebRTC] Add ICE candidate err:', e));
          } else {
            // Queue until remote description is set
            const q = candidateQueuesRef.current.get(from) || [];
            q.push(candidate);
            candidateQueuesRef.current.set(from, q);
          }
        }
      } catch (signalErr) {
        console.error('[WebRTC] Signaling error for peer', from, signalErr);
      }
    });

    // 4. Handle peer media toggle (mic / cam)
    newSocket.on('user-media-toggled', ({ socketId, micOn, camOn }) => {
      setPeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, micOn, camOn } : p))
      );
    });

    // 5. Handle hand toggle
    newSocket.on('user-hand-toggled', ({ socketId, handRaised: hr, name }) => {
      setPeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, handRaised: hr } : p))
      );
      if (hr) {
        setSystemNotice({ type: 'info', message: `${name} raised their hand ✋` });
      }
    });

    // 6. Handle chat message
    newSocket.on('chat-message', (msg) => {
      setChatMessages((prev) => [...prev, msg]);
      setUnreadCount((prev) => prev + 1);
    });

    // 7. Handle host mute request
    newSocket.on('host-mute-request', ({ requestedBy }) => {
      setSystemNotice({
        type: 'warning',
        message: `${requestedBy} (Host) requested that you mute your microphone.`,
      });
    });

    // 8. Handle removed from room
    newSocket.on('removed-from-room', ({ reason }) => {
      setSystemNotice({
        type: 'error',
        message: reason || 'You have been removed from the meeting.',
      });
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    });

    // 9. Handle meeting lock toggled
    newSocket.on('meeting-lock-toggled', ({ isLocked, lockedBy }) => {
      setRoomSettings((prev) => ({ ...prev, isLocked }));
      setSystemNotice({
        type: 'info',
        message: isLocked ? `Meeting locked by ${lockedBy}` : `Meeting unlocked by ${lockedBy}`,
      });
    });

    // 10. Handle permissions toggled
    newSocket.on('permission-toggled', (permissions) => {
      setRoomSettings((prev) => ({ ...prev, ...permissions }));
    });

    // 11. Handle co-host toggled
    newSocket.on('cohost-toggled', ({ socketId, isCoHost: coh, name }) => {
      if (newSocket.id === socketId) {
        setIsCoHost(coh);
        setSystemNotice({
          type: 'info',
          message: coh ? 'You have been assigned as Co-Host' : 'Your Co-Host role was revoked',
        });
      }
      setPeers((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, isCoHost: coh } : p))
      );
    });

    // 12. Handle host changed
    newSocket.on('host-changed', ({ newHostSocketId, name }) => {
      if (newSocket.id === newHostSocketId) {
        setIsHost(true);
        setSystemNotice({ type: 'info', message: 'You are now the meeting host.' });
      } else {
        setSystemNotice({ type: 'info', message: `${name} is now the host.` });
      }
      setPeers((prev) =>
        prev.map((p) => ({ ...p, isHost: p.socketId === newHostSocketId }))
      );
    });

    // 13. Handle meeting ended by host
    newSocket.on('meeting-ended', ({ reason }) => {
      setSystemNotice({ type: 'error', message: reason || 'Meeting ended by host.' });
      setTimeout(() => {
        window.location.href = '/';
      }, 2500);
    });

    // 14. Handle recording status
    newSocket.on('recording-status', ({ isRecording: rec, hostName }) => {
      setIsRecording(rec);
      setRecordingHostName(hostName);
      setSystemNotice({
        type: 'info',
        message: rec ? `Meeting is now being recorded by ${hostName}` : 'Recording stopped.',
      });
    });

    // 15. Handle peer leave
    newSocket.on('user-left', ({ socketId, name }) => {
      console.log('[WebRTC Socket] User left:', name, socketId);
      cleanupPeer(socketId);
      setPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      setSystemNotice({ type: 'info', message: `${name || 'A participant'} left the meeting.` });
    });

    return () => {
      // Disconnect socket and close all peer connections
      newSocket.disconnect();
      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      remoteStreamsRef.current.clear();
    };
  }, [roomId, user]);

  /**
   * Helper: Create and configure an RTCPeerConnection for a remote peer
   */
  const createPeerConnection = useCallback(
    (targetSocketId, isInitiator, peerMeta = null, activeSocket = socket) => {
      // Return existing if already stable
      if (peerConnectionsRef.current.has(targetSocketId)) {
        return peerConnectionsRef.current.get(targetSocketId);
      }

      const pc = new RTCPeerConnection({
        iceServers: iceServersRef.current,
        iceCandidatePoolSize: 2,
      });

      peerConnectionsRef.current.set(targetSocketId, pc);

      // Create a remote MediaStream for this peer
      const remoteStream = new MediaStream();
      remoteStreamsRef.current.set(targetSocketId, remoteStream);

      // Initialize peer in state
      setPeers((prev) => {
        const exists = prev.some((p) => p.socketId === targetSocketId);
        if (exists) return prev;
        return [
          ...prev,
          {
            socketId: targetSocketId,
            name: peerMeta?.name || 'Participant',
            avatar: peerMeta?.avatar || null,
            isHost: peerMeta?.isHost || false,
            isCoHost: peerMeta?.isCoHost || false,
            micOn: peerMeta?.micOn !== false,
            camOn: peerMeta?.camOn !== false,
            handRaised: peerMeta?.handRaised || false,
            stream: remoteStream,
            connectionQuality: 'good',
            isSpeaking: false,
          },
        ];
      });

      // Add local audio and video tracks to this peer connection
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Handle receiving remote tracks
      pc.ontrack = (event) => {
        console.log('[WebRTC] Received remote track from', targetSocketId, event.track.kind);
        event.streams[0].getTracks().forEach((t) => {
          if (!remoteStream.getTracks().some((existing) => existing.id === t.id)) {
            remoteStream.addTrack(t);
          }
        });
        // Force state update to bind stream to video element
        setPeers((prev) =>
          prev.map((p) => (p.socketId === targetSocketId ? { ...p, stream: remoteStream } : p))
        );
      };

      // Handle ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate && activeSocket) {
          activeSocket.emit('signal', {
            to: targetSocketId,
            signal: event.candidate,
          });
        }
      };

      // Monitor ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE state (${targetSocketId}):`, pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          // Attempt ICE restart
          pc.restartIce();
        }
      };

      // If this peer is initiator, create offer
      if (isInitiator) {
        pc.onnegotiationneeded = async () => {
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            activeSocket.emit('signal', {
              to: targetSocketId,
              signal: offer,
            });
          } catch (err) {
            console.error('[WebRTC] Negotiation error:', err);
          }
        };
      }

      return pc;
    },
    [localStream, socket]
  );

  /**
   * Helper: Cleanup peer resources
   */
  const cleanupPeer = (targetSocketId) => {
    const pc = peerConnectionsRef.current.get(targetSocketId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(targetSocketId);
    }
    remoteStreamsRef.current.delete(targetSocketId);
    candidateQueuesRef.current.delete(targetSocketId);
  };

  /**
   * Sync local media changes (mic / camera toggles) to all active peer connections
   */
  useEffect(() => {
    if (!socket || !isConnected) return;
    socket.emit('toggle-media', { micOn: isMicOn, camOn: isCamOn });
  }, [isMicOn, isCamOn, socket, isConnected]);

  /**
   * Handle when localStream changes or updates tracks
   */
  useEffect(() => {
    if (!localStream) return;

    peerConnectionsRef.current.forEach((pc) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach((track) => {
        const sender = senders.find((s) => s.track && s.track.kind === track.kind);
        if (sender) {
          sender.replaceTrack(track).catch((err) => console.warn('[WebRTC] replaceTrack err:', err));
        } else {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  /**
   * Screen Sharing Toggle
   */
  const toggleScreenShare = async () => {
    if (!roomSettings.screenShareEnabled && !isHost && !isCoHost) {
      setSystemNotice({
        type: 'warning',
        message: 'Screen sharing is disabled by the host.',
      });
      return;
    }

    if (isScreenSharing) {
      // Stop screen share and restore camera track
      stopScreenShare();
      return;
    }

    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        alert('Screen sharing is not supported by your browser.');
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;
      setIsScreenSharing(true);

      // Replace camera video track with screen track across all peers
      peerConnectionsRef.current.forEach((pc) => {
        const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        }
      });

      // When user clicks the browser's native "Stop sharing" button
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.error('Screen sharing error:', err);
      }
    }
  };

  const stopScreenShare = () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore original camera track to all peers
    const cameraTrack = localStream?.getVideoTracks()[0] || null;
    peerConnectionsRef.current.forEach((pc) => {
      const videoSender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
      if (videoSender && cameraTrack) {
        videoSender.replaceTrack(cameraTrack);
      }
    });
  };

  /**
   * Raise / Lower Hand Toggle
   */
  const toggleRaiseHand = () => {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (socket && isConnected) {
      socket.emit('raise-hand', { handRaised: nextState });
    }
  };

  /**
   * Send In-Call Chat Message
   */
  const sendChatMessage = (text, emoji = null, file = null) => {
    if (!socket || !isConnected) return;
    socket.emit('chat-message', { text, emoji, file }, (res) => {
      if (!res.success) {
        setSystemNotice({ type: 'error', message: res.message });
      }
    });
  };

  /**
   * Host Moderation Actions
   */
  const performHostAction = (action, targetSocketId = null, extra = {}) => {
    if (!socket || !isConnected) return;
    socket.emit(
      'host-action',
      {
        action,
        targetSocketId,
        ...extra,
      },
      (res) => {
        if (!res.success) {
          setSystemNotice({ type: 'error', message: res.message });
        }
      }
    );
  };

  /**
   * Client-side Local Mute (allows muting an individual remote peer locally)
   */
  const toggleLocalMutePeer = (targetSocketId) => {
    setLocallyMutedPeers((prev) => {
      const next = new Set(prev);
      if (next.has(targetSocketId)) {
        next.delete(targetSocketId);
      } else {
        next.add(targetSocketId);
      }
      return next;
    });
  };

  /**
   * Local Consent-Aware Meeting Recording (via MediaRecorder)
   */
  const startLocalRecording = () => {
    try {
      if (!localStream) {
        alert('Cannot record without local media enabled.');
        return;
      }

      // Record audio/video stream
      recordedChunksRef.current = [];
      const options = { mimeType: 'video/webm;codecs=vp9,opus' };
      let recorder;
      try {
        recorder = new MediaRecorder(localStream, options);
      } catch {
        recorder = new MediaRecorder(localStream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `MeetFlow-Recording-${roomId}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      };

      recorder.start(1000); // 1-second chunks
      mediaRecorderRef.current = recorder;

      // Broadcast recording status so all participants are notified
      if (socket && isConnected) {
        socket.emit('recording-status', { isRecording: true });
      }
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed to start:', err);
      alert('Unable to start recording on this browser.');
    }
  };

  const stopLocalRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    if (socket && isConnected) {
      socket.emit('recording-status', { isRecording: false });
    }
    setIsRecording(false);
  };

  return {
    socket,
    isConnected,
    isHost,
    isCoHost,
    peers,
    roomSettings,
    isScreenSharing,
    toggleScreenShare,
    handRaised,
    toggleRaiseHand,
    chatMessages,
    unreadCount,
    setUnreadCount,
    sendChatMessage,
    performHostAction,
    locallyMutedPeers,
    toggleLocalMutePeer,
    isRecording,
    recordingHostName,
    startLocalRecording,
    stopLocalRecording,
    systemNotice,
    setSystemNotice,
  };
}
