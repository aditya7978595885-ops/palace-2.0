import { useCallback, useEffect, useRef, useState } from 'react';

export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'active'
  | 'denied'
  | 'unavailable'
  | 'error';

export interface FaceTrackingPose {
  x: number;      // normalized -1 (left) to +1 (right)
  y: number;      // normalized -1 (bottom) to +1 (top)
  scale: number;  // relative scale around 1.0
  detected: boolean;
}

interface BrowserFaceDetector {
  detect: (
    source: HTMLVideoElement | HTMLCanvasElement
  ) => Promise<Array<{ boundingBox: DOMRectReadOnly }>>;
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => BrowserFaceDetector;
  }
}

/**
 * Local webcam hook with 100% client-side face-forehead tracking
 * (uses native browser FaceDetector if available, otherwise local canvas skin-region tracking).
 * Zero frames are ever uploaded or transmitted to any server.
 */
export function useCamera(autoTrack = true) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const trackerCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const smoothPoseRef = useRef<FaceTrackingPose>({
    x: 0,
    y: 0.42,
    scale: 1,
    detected: false,
  });

  const [status, setStatus] = useState<CameraStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [facePose, setFacePose] = useState<FaceTrackingPose>({
    x: 0,
    y: 0.42,
    scale: 1,
    detected: false,
  });

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
    setErrorMessage(null);
    setFacePose({ x: 0, y: 0.42, scale: 1, detected: false });
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      setErrorMessage('Camera access is not supported in this browser.');
      return;
    }

    setStatus('requesting');
    setErrorMessage(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('active');
    } catch (err) {
      const error = err as DOMException;
      if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
        setStatus('denied');
        setErrorMessage(
          'Camera permission was declined. You can grant access in your browser settings or preview the 3D crown in Studio Mode.'
        );
      } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
        setStatus('unavailable');
        setErrorMessage(
          'No webcam was detected on this device. You can still inspect and customize the 3D crown in Studio Mode.'
        );
      } else {
        setStatus('error');
        setErrorMessage('Unable to start the camera. Please verify it is not in use by another app.');
      }
    }
  }, []);

  // Re-attach stream if video element mounts slightly after status becomes active
  useEffect(() => {
    if (status === 'active' && videoRef.current && streamRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [status]);

  // Local client-side face tracking loop
  useEffect(() => {
    if (status !== 'active' || !autoTrack) {
      return;
    }

    let cancelled = false;
    const detector =
      typeof window !== 'undefined' && typeof window.FaceDetector === 'function'
        ? new window.FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
        : null;

    if (!trackerCanvasRef.current) {
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 72;
      trackerCanvasRef.current = c;
    }

    const interval = window.setInterval(async () => {
      if (cancelled) return;
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;

      let targetX = smoothPoseRef.current.x;
      let targetY = smoothPoseRef.current.y;
      let targetScale = smoothPoseRef.current.scale;
      let detected = false;

      if (detector) {
        try {
          const faces = await detector.detect(video);
          if (faces.length > 0) {
            const box = faces[0].boundingBox;
            // Mirrored X coordinate
            const normCenterX = 1 - (box.x + box.width * 0.5) / video.videoWidth;
            const normForeheadY = (box.y + box.height * 0.04) / video.videoHeight;
            targetX = (normCenterX - 0.5) * 2;
            targetY = (0.5 - normForeheadY) * 2;
            targetScale = Math.max(0.65, Math.min(1.65, (box.width / video.videoWidth) * 3.1));
            detected = true;
          }
        } catch {
          // Fall back silently to canvas heuristic below
        }
      }

      if (!detected && trackerCanvasRef.current) {
        const canvas = trackerCanvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let sumX = 0;
          let sumY = 0;
          let minY = canvas.height;
          let minX = canvas.width;
          let maxX = 0;
          let count = 0;

          // YCbCr skin-tone cluster detection in center region
          for (let y = 6; y < canvas.height - 8; y++) {
            for (let x = 14; x < canvas.width - 14; x++) {
              const idx = (y * canvas.width + x) * 4;
              const r = frame[idx];
              const g = frame[idx + 1];
              const b = frame[idx + 2];

              const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
              const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
              if (r > 70 && cb >= 77 && cb <= 127 && cr >= 133 && cr <= 175) {
                sumX += x;
                sumY += y;
                if (y < minY) minY = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                count++;
              }
            }
          }

          if (count > 85) {
            const avgX = sumX / count;
            const headWidth = Math.max(14, maxX - minX);
            const mirroredNormX = 1 - avgX / canvas.width;
            const crownYNorm = Math.max(0.06, (minY - 2) / canvas.height);
            targetX = (mirroredNormX - 0.5) * 1.6;
            targetY = (0.5 - crownYNorm) * 1.65;
            targetScale = Math.max(0.7, Math.min(1.5, (headWidth / canvas.width) * 2.75));
            detected = true;
          }
        }
      }

      // Smooth exponential filter to prevent jitter
      const alpha = 0.24;
      const next: FaceTrackingPose = {
        x: smoothPoseRef.current.x + (targetX - smoothPoseRef.current.x) * alpha,
        y: smoothPoseRef.current.y + (targetY - smoothPoseRef.current.y) * alpha,
        scale:
          smoothPoseRef.current.scale +
          (targetScale - smoothPoseRef.current.scale) * alpha,
        detected,
      };
      smoothPoseRef.current = next;
      if (!cancelled) {
        setFacePose(next);
      }
    }, 85);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [status, autoTrack]);

  // Guaranteed cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    videoRef,
    status,
    errorMessage,
    facePose,
    startCamera,
    stopCamera,
  };
}
