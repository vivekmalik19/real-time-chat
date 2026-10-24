import { useState, useRef, useEffect, useCallback } from 'react';
import { parseMediaError, checkMediaSupport } from '../utils/mediaErrors';

/**
 * Custom hook to manage local camera and microphone stream lifecycle, track controls, and cleanup
 */
export function useLocalMedia() {
  const [stream, setStream] = useState(null);
  const [mediaStatus, setMediaStatus] = useState('idle'); // 'idle' | 'requesting' | 'connected' | 'error'
  const [isMediaGranted, setIsMediaGranted] = useState(false);
  const [isCamEnabled, setIsCamEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);
  const [error, setError] = useState(null);

  // Ref to hold the active stream across re-renders and for cleanup
  const streamRef = useRef(null);
  const isMountedRef = useRef(true);

  // Helper to safely stop all active tracks
  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping track:', e);
        }
      });
      streamRef.current = null;
    }

    if (isMountedRef.current) {
      setStream(null);
      setIsMediaGranted(false);
      setIsCamEnabled(false);
      setIsMicEnabled(false);
      setMediaStatus('idle');
      setError(null);
    }
  }, []);

  // Request media access with getUserMedia
  const requestMedia = useCallback(async () => {
    const support = checkMediaSupport();
    if (!support.isSupported) {
      const errObj = {
        title: 'Browser Compatibility',
        message: support.reason,
        actionText: 'Understood',
        type: 'error',
      };
      setError(errObj);
      setMediaStatus('error');
      return { success: false, error: errObj };
    }

    // Stop existing stream if any before requesting new
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setMediaStatus('requesting');
    setError(null);

    try {
      // Standard video & audio constraints
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // If component unmounted while prompt was pending, stop tracks immediately
      if (!isMountedRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop());
        return { success: false };
      }

      streamRef.current = mediaStream;

      const videoTrack = mediaStream.getVideoTracks()[0];
      const audioTrack = mediaStream.getAudioTracks()[0];

      const camActive = !!(videoTrack && videoTrack.enabled);
      const micActive = !!(audioTrack && audioTrack.enabled);

      // Listen for unexpected track ending (e.g. unplugged camera or system restriction)
      if (videoTrack) {
        videoTrack.onended = () => {
          if (isMountedRef.current) {
            setIsCamEnabled(false);
          }
        };
      }

      if (audioTrack) {
        audioTrack.onended = () => {
          if (isMountedRef.current) {
            setIsMicEnabled(false);
          }
        };
      }

      setStream(mediaStream);
      setIsMediaGranted(true);
      setIsCamEnabled(camActive);
      setIsMicEnabled(micActive);
      setMediaStatus('connected');
      setError(null);

      return { success: true, stream: mediaStream };
    } catch (err) {
      if (!isMountedRef.current) return { success: false };

      const parsed = parseMediaError(err);
      setError(parsed);
      setMediaStatus('error');
      setIsMediaGranted(false);
      setStream(null);

      return { success: false, error: parsed };
    }
  }, []);

  // Toggle Video Track
  const toggleCam = useCallback(() => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextState = !videoTrack.enabled;
      videoTrack.enabled = nextState;
      setIsCamEnabled(nextState);
      return nextState;
    }
    return false;
  }, []);

  // Toggle Audio Track
  const toggleMic = useCallback(() => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextState = !audioTrack.enabled;
      audioTrack.enabled = nextState;
      setIsMicEnabled(nextState);
      return nextState;
    }
    return false;
  }, []);

  // Clear current error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clean up all tracks on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('Error during unmount cleanup:', e);
          }
        });
        streamRef.current = null;
      }
    };
  }, []);

  return {
    stream,
    mediaStatus,
    isMediaGranted,
    isCamEnabled,
    isMicEnabled,
    error,
    requestMedia,
    toggleCam,
    toggleMic,
    stopMedia,
    clearError,
  };
}

export default useLocalMedia;
