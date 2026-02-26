'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseMediaStreamReturn {
  stream: MediaStream | null;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isCameraOn: boolean;
  isMicOn: boolean;
  toggleCamera: () => void;
  toggleMic: () => void;
  error: string | null;
}

export function useMediaStream(): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Initialize media stream
  useEffect(() => {
    let active = true;
    let currentStream: MediaStream | null = null;

    async function startStream() {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!active) {
          mediaStream.getTracks().forEach(t => t.stop());
          return;
        }
        currentStream = mediaStream;
        setStream(mediaStream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {
            // Autoplay blocked by browser — video will play on user interaction
          });
        }
      } catch (err) {
        if (active) {
          const name = err instanceof DOMException ? err.name : '';
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            setError('Camera/mic access denied. Please allow permissions in your browser settings and reload the page.');
          } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            setError('No camera or microphone found. Please connect a device and reload.');
          } else if (name === 'NotReadableError' || name === 'TrackStartError') {
            setError('Camera or microphone is in use by another app. Close it and reload.');
          } else {
            setError(err instanceof Error ? err.message : 'Failed to access media devices');
          }
        }
      }
    }

    startStream();

    return () => {
      active = false;
      currentStream?.getTracks().forEach(t => t.stop());
    };
  }, []);

  // Sync video element when stream changes
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    video.play().catch(() => {
      // Autoplay blocked by browser — video will play on user interaction
    });
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOn(prev => !prev);
    }
  }, [stream]);

  const toggleMic = useCallback(() => {
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicOn(prev => !prev);
    }
  }, [stream]);

  return { stream, videoRef, isCameraOn, isMicOn, toggleCamera, toggleMic, error };
}
