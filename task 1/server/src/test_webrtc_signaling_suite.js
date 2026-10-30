/**
 * MeetFlow Task 1: Real-Time WebRTC Calling & Signaling Test Suite
 * Tests Socket.IO signaling, mesh room management, moderation, file sharing, and limits
 */

import { io as ClientIO } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5001';

function createClientSocket() {
  return ClientIO(SERVER_URL, {
    transports: ['websocket'],
    reconnection: false,
    timeout: 5000,
  });
}

async function runSignalingSuite() {
  console.log('====================================================');
  console.log('🚀 MEETFLOW TASK 1: WEBRTC SIGNALING TEST SUITE');
  console.log('====================================================\n');

  const testRoomId = `test-room-${Date.now()}`;
  let hostSocket = null;
  let peerSocket1 = null;
  let peerSocket2 = null;

  try {
    // -------------------------------------------------------------
    // TEST 1: Host creates & joins room
    // -------------------------------------------------------------
    console.log('▶ Test 1: Room Creation & Host Assignment');
    hostSocket = createClientSocket();

    await new Promise((resolve, reject) => {
      hostSocket.on('connect', () => {
        hostSocket.emit(
          'join-room',
          { roomId: testRoomId, name: 'Alice Host', micOn: true, camOn: true },
          (res) => {
            if (res.success && res.isHost && res.roomId === testRoomId) {
              console.log(`  Room created: ${res.roomId}`);
              console.log(`  Host: Alice (socketId: ${hostSocket.id})`);
              console.log(`  ICE Servers: ${res.iceServers.length} configured`);
              console.log('  ✔ Passed: Host joined and room initialized\n');
              resolve();
            } else {
              reject(new Error(`Test 1 Failed: ${JSON.stringify(res)}`));
            }
          }
        );
      });
      hostSocket.on('connect_error', reject);
    });

    // -------------------------------------------------------------
    // TEST 2: Second participant joins & receives existing peers
    // -------------------------------------------------------------
    console.log('▶ Test 2: Second Participant Joins & Receives Peer List');
    peerSocket1 = createClientSocket();

    await new Promise((resolve, reject) => {
      let hostNotified = false;
      let peerJoined = false;

      // Host should receive user-joined
      hostSocket.once('user-joined', ({ participant }) => {
        if (participant.name === 'Bob Peer') {
          hostNotified = true;
          if (peerJoined) resolve();
        }
      });

      peerSocket1.on('connect', () => {
        peerSocket1.emit(
          'join-room',
          { roomId: testRoomId, name: 'Bob Peer', micOn: false, camOn: true },
          (res) => {
            if (res.success && !res.isHost && res.existingParticipants.length === 1) {
              console.log(`  Bob joined, received ${res.existingParticipants.length} existing peer(s)`);
              peerJoined = true;
              if (hostNotified) resolve();
            } else {
              reject(new Error(`Test 2 Failed: ${JSON.stringify(res)}`));
            }
          }
        );
      });
    });
    console.log('  ✔ Passed: Second peer joined and host received user-joined broadcast\n');

    // -------------------------------------------------------------
    // TEST 3: WebRTC Signaling Relay (Offer -> Answer -> Candidate)
    // -------------------------------------------------------------
    console.log('▶ Test 3: WebRTC Signaling Relay (Offer/Answer)');
    await new Promise((resolve, reject) => {
      const mockOffer = { type: 'offer', sdp: 'v=0\r\no=- 12345 2 IN IP4 127.0.0.1...' };
      const mockAnswer = { type: 'answer', sdp: 'v=0\r\no=- 67890 2 IN IP4 127.0.0.1...' };

      // Bob receives offer from Alice and replies with answer
      peerSocket1.once('signal', ({ from, signal }) => {
        if (from === hostSocket.id && signal.type === 'offer') {
          console.log('  Bob received WebRTC Offer from Alice. Sending Answer...');
          peerSocket1.emit('signal', { to: from, signal: mockAnswer });
        }
      });

      // Alice receives answer from Bob
      hostSocket.once('signal', ({ from, signal }) => {
        if (from === peerSocket1.id && signal.type === 'answer') {
          console.log('  Alice received WebRTC Answer from Bob');
          resolve();
        }
      });

      // Alice sends offer to Bob
      hostSocket.emit('signal', { to: peerSocket1.id, signal: mockOffer });
    });
    console.log('  ✔ Passed: Bidirectional WebRTC signaling relayed cleanly\n');

    // -------------------------------------------------------------
    // TEST 4: Media State & Hand Raised Toggling
    // -------------------------------------------------------------
    console.log('▶ Test 4: Real-time Media State & Hand Toggling');
    await new Promise((resolve) => {
      hostSocket.once('user-media-toggled', ({ socketId, micOn, camOn }) => {
        if (socketId === peerSocket1.id && micOn === true) {
          console.log('  Host received media toggle: Bob unmuted');
          resolve();
        }
      });

      peerSocket1.emit('toggle-media', { micOn: true, camOn: true });
    });

    await new Promise((resolve) => {
      hostSocket.once('user-hand-toggled', ({ socketId, handRaised }) => {
        if (socketId === peerSocket1.id && handRaised === true) {
          console.log('  Host received hand toggle: Bob raised hand');
          resolve();
        }
      });

      peerSocket1.emit('raise-hand', { handRaised: true });
    });
    console.log('  ✔ Passed: Media status and hand raise events broadcast accurately\n');

    // -------------------------------------------------------------
    // TEST 5: In-call Chat & File Size/Type Validation
    // -------------------------------------------------------------
    console.log('▶ Test 5: In-call Chat & Safe File Validation');
    // Normal message
    await new Promise((resolve) => {
      hostSocket.once('chat-message', (msg) => {
        if (msg.text === 'Hello room!' && msg.senderName === 'Bob Peer') {
          console.log(`  Received chat: "${msg.text}" from ${msg.senderName}`);
          resolve();
        }
      });
      peerSocket1.emit('chat-message', { text: 'Hello room!' });
    });

    // File exceeding 10MB rejection
    await new Promise((resolve, reject) => {
      peerSocket1.emit(
        'chat-message',
        {
          text: 'Huge file',
          file: { name: 'large.zip', size: 15 * 1024 * 1024, type: 'application/zip', data: 'blob' },
        },
        (res) => {
          if (!res.success && res.message.includes('10MB')) {
            console.log(`  Blocked oversized file: "${res.message}"`);
            resolve();
          } else {
            reject(new Error('Test 5 Failed: Oversized file was not blocked!'));
          }
        }
      );
    });

    // Disallowed executable rejection (.exe)
    await new Promise((resolve, reject) => {
      peerSocket1.emit(
        'chat-message',
        {
          text: 'Executable file',
          file: { name: 'trojan.exe', size: 1024, type: 'application/octet-stream', data: 'bin' },
        },
        (res) => {
          if (!res.success && res.message.includes('Executable')) {
            console.log(`  Blocked executable extension: "${res.message}"`);
            resolve();
          } else {
            reject(new Error('Test 5 Failed: Executable file was not blocked!'));
          }
        }
      );
    });
    console.log('  ✔ Passed: Chat and file security constraints verified\n');

    // -------------------------------------------------------------
    // TEST 6: Host Moderation (Mute Request & Room Lock)
    // -------------------------------------------------------------
    console.log('▶ Test 6: Host Moderation (Mute Request & Room Lock)');
    // Mute Request (Cannot force hardware mute; sends polite request)
    await new Promise((resolve) => {
      peerSocket1.once('host-mute-request', ({ requestedBy }) => {
        console.log(`  Bob received mute request from host: ${requestedBy}`);
        resolve();
      });

      hostSocket.emit('host-action', { action: 'mute-request', targetSocketId: peerSocket1.id });
    });

    // Lock meeting
    await new Promise((resolve) => {
      peerSocket1.once('meeting-lock-toggled', ({ isLocked }) => {
        if (isLocked) {
          console.log('  Meeting locked by host');
          resolve();
        }
      });

      hostSocket.emit('host-action', { action: 'lock-meeting', enabled: true });
    });

    // Verify 3rd user cannot join locked room
    peerSocket2 = createClientSocket();
    await new Promise((resolve, reject) => {
      peerSocket2.on('connect', () => {
        peerSocket2.emit('join-room', { roomId: testRoomId, name: 'Late Charlie' }, (res) => {
          if (!res.success && res.code === 'ROOM_LOCKED') {
            console.log(`  Locked room blocked Late Charlie: "${res.message}"`);
            resolve();
          } else {
            reject(new Error('Test 6 Failed: Locked room permitted unauthorized join!'));
          }
        });
      });
    });

    // Unlock meeting
    await new Promise((resolve) => {
      hostSocket.emit('host-action', { action: 'lock-meeting', enabled: false }, () => resolve());
    });
    console.log('  ✔ Passed: Host moderation actions and room lock enforced\n');

    // -------------------------------------------------------------
    // TEST 7: Remove Participant (Kick)
    // -------------------------------------------------------------
    console.log('▶ Test 7: Remove Participant (Kick Action)');
    await new Promise((resolve) => {
      peerSocket1.once('removed-from-room', ({ reason }) => {
        console.log(`  Bob kicked by host: "${reason}"`);
        resolve();
      });

      hostSocket.emit('host-action', { action: 'remove-participant', targetSocketId: peerSocket1.id });
    });
    console.log('  ✔ Passed: Host kick action executed and target notified\n');

    console.log('====================================================');
    console.log('🎉 ALL 7 SIGNALING & WEBRTC MESH TESTS PASSED 100%!');
    console.log('====================================================\n');
  } catch (err) {
    console.error('❌ Signaling Test Suite Error:', err);
    process.exit(1);
  } finally {
    if (hostSocket) hostSocket.disconnect();
    if (peerSocket1) peerSocket1.disconnect();
    if (peerSocket2) peerSocket2.disconnect();
    process.exit(0);
  }
}

runSignalingSuite();
