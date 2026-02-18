'use client';

import { useState, useRef, useCallback } from 'react';
import type { UploadedImage } from '@/types';

export type VideoStatus = 'idle' | 'generating' | 'success' | 'error';

export function useVideoGeneration() {
  const [referenceImage, setReferenceImage] = useState<UploadedImage | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [sound, setSound] = useState(false);
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const generate = useCallback(async () => {
    if (!prompt.trim()) return 'Please enter a prompt for the video.';

    setStatus('generating');
    setErrorMsg(null);
    setProgress(0);

    try {
      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageInput: referenceImage
            ? { base64: referenceImage.base64, mimeType: referenceImage.mimeType }
            : undefined,
          prompt,
          aspectRatio,
          duration,
          sound,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Video generation failed');
      }

      const { taskId } = await res.json();

      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/generate/status?taskId=${taskId}`);
          if (!statusRes.ok) throw new Error('Status check failed');
          const data = await statusRes.json();
          setProgress(data.progress);

          if (data.status === 'completed' && data.resultUrls?.length) {
            stopPolling();
            setVideoUrl(data.resultUrls[0]);
            setStatus('success');
          } else if (data.status === 'failed') {
            stopPolling();
            throw new Error(data.error || 'Video generation failed');
          }
        } catch (e) {
          stopPolling();
          setErrorMsg(e instanceof Error ? e.message : 'Generation failed');
          setStatus('error');
        }
      }, 5000);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : 'Video generation failed');
      setStatus('error');
    }

    return null;
  }, [prompt, referenceImage, aspectRatio, duration, sound, stopPolling]);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setVideoUrl(null);
    setErrorMsg(null);
    setProgress(0);
  }, [stopPolling]);

  return {
    referenceImage, setReferenceImage,
    prompt, setPrompt,
    aspectRatio, setAspectRatio,
    duration, setDuration,
    sound, setSound,
    status, videoUrl, progress, errorMsg,
    generate, reset,
  };
}
