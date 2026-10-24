import React, { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { PhoneOff } from 'lucide-react';
import MeetingHeader from '../components/meeting/MeetingHeader';
import VideoPlaceholder from '../components/meeting/VideoPlaceholder';
import MeetingControls from '../components/meeting/MeetingControls';
import MeetingSidebar from '../components/meeting/MeetingSidebar';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import Button from '../components/common/Button';
import useMeetingTimer from '../hooks/useMeetingTimer';
import useLocalMedia from '../hooks/useLocalMedia';
import { copyTextToClipboard, formatMeetingInvitation } from '../utils/clipboard';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  // If someone enters a URL without a roomId
  if (!roomId) {
    return <Navigate to="/" replace />;
  }

  // Meeting duration timer
  const { formattedTime } = useMeetingTimer(true);

  // Real local media hook for camera & microphone
  const {
    stream,
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

  // Helper to trigger toast with auto-dismiss
  const showToast = (message, type = 'info', duration = 3500) => {
    setToast({ message, type });
    if (duration > 0) {
      setTimeout(() => {
        setToast((prev) => (prev.message === message ? { message: '', type: 'info' } : prev));
      }, duration);
    }
  };

  // Helper to request media and display feedback toast
  const handleRequestMedia = async () => {
    const result = await requestMedia();
    if (result.success) {
      showToast('Camera and microphone enabled successfully!', 'success');
    } else if (result.error) {
      showToast(result.error.title + ': ' + result.error.message, 'error', 5000);
    }
  };

  // Clipboard Action 1: Copy Room ID
  const handleCopyRoomId = async () => {
    const result = await copyTextToClipboard(roomId);
    if (result.success) {
      showToast(`Room ID (${roomId}) copied to clipboard!`, 'success');
    } else {
      showToast(result.error || 'Failed to copy Room ID', 'error');
    }
  };

  // Clipboard Action 2: Share Invitation
  const handleShareInvitation = async () => {
    const fullInvite = formatMeetingInvitation(roomId, window.location.href);
    const result = await copyTextToClipboard(fullInvite);
    if (result.success) {
      showToast('Meeting invitation link copied to clipboard!', 'success');
    } else {
      showToast(result.error || 'Failed to copy invitation', 'error');
    }
  };

  // Toggle Microphone (Real track toggle)
  const handleToggleMic = () => {
    if (!isMediaGranted) {
      showToast('Please enable camera & microphone first to use audio controls.', 'info');
      handleRequestMedia();
      return;
    }

    const nextState = toggleMic();
    showToast(nextState ? 'Microphone unmuted (live)' : 'Microphone muted', nextState ? 'success' : 'info');
  };

  // Toggle Camera (Real track toggle)
  const handleToggleCam = () => {
    if (!isMediaGranted) {
      showToast('Please enable camera & microphone first to use video controls.', 'info');
      handleRequestMedia();
      return;
    }

    const nextState = toggleCam();
    showToast(nextState ? 'Camera turned on (live)' : 'Camera turned off', nextState ? 'success' : 'info');
  };

  // Screen Share Click
  const handleScreenShareClick = () => {
    showToast('Screen sharing will be available in a future update.', 'info');
  };

  // Side Panel Toggle
  const handleTogglePanel = (panelName) => {
    setActiveSidebarPanel((prev) => (prev === panelName ? null : panelName));
  };

  // Switch Side Panel Tab
  const handleSwitchPanel = (panelName) => {
    setActiveSidebarPanel(panelName);
  };

  // Leave Meeting Confirmed - Stop all media tracks and navigate to Home
  const handleConfirmLeave = () => {
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
        {/* Main Video Arena Area */}
        <main className="flex-1 min-h-0 relative flex items-center justify-center bg-gradient-to-b from-surface-950 via-[#0a0f1d] to-surface-950 overflow-hidden p-2 sm:p-4">
          <VideoPlaceholder
            roomId={roomId}
            stream={stream}
            mediaStatus={mediaStatus}
            isMediaGranted={isMediaGranted}
            isCamEnabled={isCamEnabled}
            isMicEnabled={isMicEnabled}
            onRequestMedia={handleRequestMedia}
            error={mediaError}
          />
        </main>

        {/* Side Panel (Participants / Chat / Info) */}
        {activeSidebarPanel && (
          <MeetingSidebar
            activePanel={activeSidebarPanel}
            onClose={() => setActiveSidebarPanel(null)}
            onSwitchPanel={handleSwitchPanel}
            roomId={roomId}
            isMicOn={isMicEnabled && isMediaGranted}
            isCamOn={isCamEnabled && isMediaGranted}
            isMediaGranted={isMediaGranted}
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
        activePanel={activeSidebarPanel}
        onTogglePanel={handleTogglePanel}
        onScreenShareClick={handleScreenShareClick}
        onRequestLeave={() => setShowLeaveModal(true)}
        formattedTime={formattedTime}
      />

      {/* 4. Leave Meeting Confirmation Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave this meeting?"
        icon={PhoneOff}
        iconClassName="text-rose-400 bg-rose-500/10 border-rose-500/20"
      >
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You will return to the home screen. Your camera and microphone tracks will be stopped completely. You can rejoin at any time using your Room ID ({roomId}).
        </p>
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setShowLeaveModal(false)}
          >
            Stay in Meeting
          </Button>
          <Button
            variant="danger"
            onClick={handleConfirmLeave}
          >
            Leave Meeting
          </Button>
        </div>
      </Modal>

      {/* 5. Toast Notifications Container */}
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
