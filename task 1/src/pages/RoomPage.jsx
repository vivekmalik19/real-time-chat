import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { PhoneOff, AlertTriangle, Shield, CheckCircle2 } from 'lucide-react';
import MeetingHeader from '../components/meeting/MeetingHeader';
import MeetingStage from '../components/meeting/MeetingStage';
import MeetingControls from '../components/meeting/MeetingControls';
import MeetingSidebar from '../components/meeting/MeetingSidebar';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import useMeetingTimer from '../hooks/useMeetingTimer';
import useLocalMedia from '../hooks/useLocalMedia';
import useWebRTCCall from '../hooks/useWebRTCCall';
import { useAuth } from '../context/AuthContext';
import { copyTextToClipboard, formatMeetingInvitation } from '../utils/clipboard';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if invalid room ID
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  // Meeting duration timer
  const { formattedTime } = useMeetingTimer(true);

  // 1. Real Local Media Hook (Camera & Microphone)
  const {
    stream: localStream,
    mediaStatus,
    isMediaGranted,
    isCamEnabled,
    isMicEnabled,
    error: mediaError,
    requestMedia,
    toggleCam,
    toggleMic,
    stopMedia,
  } = useLocalMedia();

  // 2. Real WebRTC Mesh & Signaling Hook
  const {
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
  } = useWebRTCCall({
    roomId,
    localStream,
    isCamOn: isCamEnabled,
    isMicOn: isMicEnabled,
    user,
  });

  // Active side panel: 'participants' | 'chat' | 'info' | null
  const [activeSidebarPanel, setActiveSidebarPanel] = useState(null);

  // Leave meeting modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Update window title dynamically
  useEffect(() => {
    document.title = `MeetFlow | Room ${roomId}`;
    return () => {
      document.title = 'MeetFlow | Connect. Collaborate. Anywhere.';
    };
  }, [roomId]);

  // Request media on initial mount if not yet requested
  useEffect(() => {
    if (!isMediaGranted && mediaStatus === 'idle') {
      requestMedia();
    }
  }, []);

  // Sync WebRTC system notices to Toast
  useEffect(() => {
    if (systemNotice) {
      showToast(systemNotice.message, systemNotice.type || 'info', 4000);
      setSystemNotice(null);
    }
  }, [systemNotice]);

  // Helper to trigger toast with auto-dismiss
  const showToast = (message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => {
        setToast((prev) => (prev.message === message ? { message: '', type: 'info' } : prev));
      }, duration);
    }
  };

  // Clipboard Actions
  const handleCopyRoomId = async () => {
    const result = await copyTextToClipboard(roomId);
    if (result.success) {
      showToast(`Room ID (${roomId}) copied to clipboard!`, 'success');
    } else {
      showToast(result.error || 'Failed to copy Room ID', 'error');
    }
  };

  const handleShareInvitation = async () => {
    const fullInvite = formatMeetingInvitation(roomId, window.location.href);
    const result = await copyTextToClipboard(fullInvite);
    if (result.success) {
      showToast('Meeting invitation link copied to clipboard!', 'success');
    } else {
      showToast(result.error || 'Failed to copy invitation', 'error');
    }
  };

  // Toggle Microphone
  const handleToggleMic = () => {
    if (!isMediaGranted) {
      requestMedia();
      return;
    }
    const nextState = toggleMic();
    showToast(nextState ? 'Microphone unmuted' : 'Microphone muted', nextState ? 'success' : 'info');
  };

  // Toggle Camera
  const handleToggleCam = () => {
    if (!isMediaGranted) {
      requestMedia();
      return;
    }
    const nextState = toggleCam();
    showToast(nextState ? 'Camera turned on' : 'Camera turned off', nextState ? 'success' : 'info');
  };

  // Toggle Side Panel
  const handleTogglePanel = (panelName) => {
    setActiveSidebarPanel((prev) => {
      const next = prev === panelName ? null : panelName;
      if (next === 'chat') setUnreadCount(0);
      return next;
    });
  };

  const handleSwitchPanel = (panelName) => {
    if (panelName === 'chat') setUnreadCount(0);
    setActiveSidebarPanel(panelName);
  };

  // Leave Meeting Confirmed
  const handleConfirmLeave = () => {
    stopMedia();
    setShowLeaveModal(false);
    navigate('/');
  };

  // Host End Meeting for All Confirmed
  const handleHostEndMeeting = () => {
    performHostAction('end-meeting');
    stopMedia();
    setShowLeaveModal(false);
    navigate('/');
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Top Meeting Bar */}
      <MeetingHeader
        roomId={roomId}
        formattedTime={formattedTime}
        onCopyRoomId={handleCopyRoomId}
        onShareInvitation={handleShareInvitation}
        onToggleInfoPanel={() => handleTogglePanel('info')}
        isInfoPanelOpen={activeSidebarPanel === 'info'}
        mediaStatus={mediaStatus}
        isCamEnabled={isCamEnabled}
        isMicEnabled={isMicEnabled}
        isMediaGranted={isMediaGranted}
      />

      {/* 2. Main Middle Area: Video Stage + Side Panel */}
      <div className="flex-1 min-h-0 relative flex overflow-hidden">
        {/* Main Video Arena */}
        <main className="flex-1 min-h-0 relative flex items-center justify-center bg-gradient-to-b from-surface-950 via-[#0a0f1d] to-surface-950 overflow-hidden">
          <MeetingStage
            localStream={localStream}
            user={user}
            isCamOn={isCamEnabled && isMediaGranted}
            isMicOn={isMicEnabled && isMediaGranted}
            isHost={isHost}
            isCoHost={isCoHost}
            handRaised={handRaised}
            peers={peers}
            isScreenSharing={isScreenSharing}
            isRecording={isRecording}
            recordingHostName={recordingHostName}
            isLocked={roomSettings.isLocked}
            locallyMutedPeers={locallyMutedPeers}
            onToggleLocalMute={toggleLocalMutePeer}
            roomId={roomId}
            onCopyRoomId={handleCopyRoomId}
          />
        </main>

        {/* Side Panel (Participants / In-call Chat / Info) */}
        {activeSidebarPanel && (
          <MeetingSidebar
            activePanel={activeSidebarPanel}
            onClose={() => setActiveSidebarPanel(null)}
            onSwitchPanel={handleSwitchPanel}
            roomId={roomId}
            user={user}
            isHost={isHost}
            isCoHost={isCoHost}
            peers={peers}
            isMicOn={isMicEnabled && isMediaGranted}
            isCamOn={isCamEnabled && isMediaGranted}
            handRaised={handRaised}
            chatMessages={chatMessages}
            onSendMessage={sendChatMessage}
            onPerformHostAction={performHostAction}
            locallyMutedPeers={locallyMutedPeers}
            onToggleLocalMute={toggleLocalMutePeer}
            roomSettings={roomSettings}
            onCopyRoomId={handleCopyRoomId}
            onShareInvitation={handleShareInvitation}
          />
        )}
      </div>

      {/* 3. Bottom Meeting Controls Bar */}
      <MeetingControls
        roomId={roomId}
        isMicOn={isMicEnabled && isMediaGranted}
        onToggleMic={handleToggleMic}
        isCamOn={isCamEnabled && isMediaGranted}
        onToggleCam={handleToggleCam}
        isMediaGranted={isMediaGranted}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={toggleScreenShare}
        handRaised={handRaised}
        onToggleRaiseHand={toggleRaiseHand}
        isRecording={isRecording}
        onToggleRecording={isRecording ? stopLocalRecording : startLocalRecording}
        isHost={isHost}
        participantCount={peers.length + 1}
        unreadChatCount={unreadCount}
        activePanel={activeSidebarPanel}
        onTogglePanel={handleTogglePanel}
        onRequestLeave={() => setShowLeaveModal(true)}
        formattedTime={formattedTime}
      />

      {/* 4. Leave / End Meeting Confirmation Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title={isHost ? 'Meeting Options' : 'Leave this meeting?'}
        icon={PhoneOff}
        iconClassName="text-rose-400 bg-rose-500/10 border-rose-500/20"
      >
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          {isHost
            ? 'As the host, you can leave the meeting (another participant will be assigned host), or end the meeting for all attendees.'
            : 'You will return to the home screen. Your camera and microphone tracks will be stopped completely.'}
        </p>

        <div className="flex items-center justify-end gap-2.5">
          <Button variant="ghost" onClick={() => setShowLeaveModal(false)}>
            Stay
          </Button>

          <Button variant="outline" onClick={handleConfirmLeave}>
            Leave Meeting
          </Button>

          {isHost && (
            <Button variant="danger" onClick={handleHostEndMeeting}>
              End Meeting for All
            </Button>
          )}
        </div>
      </Modal>

      {/* 5. Toast Notifications */}
      {toast.message && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: '', type: 'info' })}
        />
      )}
    </div>
  );
}
