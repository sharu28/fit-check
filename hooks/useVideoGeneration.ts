'use client';

import { useState, useRef, useCallback } from 'react';
import {
  composeVideoReferenceInput,
  getEnvironmentPromptHint,
} from '@/lib/video-composite';
import type {
  UploadedImage,
  GalleryItem,
  VideoEnvironmentSelection,
} from '@/types';

export type VideoStatus = 'idle' | 'generating' | 'success' | 'error';
const MAX_VIDEO_PRODUCTS = 4;

export interface VideoItem {
  id: string;
  url: string;
  timestamp: number;
}

interface UseVideoGenerationOptions {
  onVideoSaved?: (item: GalleryItem) => void;
  onCreditsRefresh?: () => void;
}

export function useVideoGeneration({ onVideoSaved, onCreditsRefresh }: UseVideoGenerationOptions = {}) {
  const [productImages, setProductImages] = useState<UploadedImage[]>([]);
  const [subjectImage, setSubjectImage] = useState<UploadedImage | null>(null);
  const [environment, setEnvironment] = useState<VideoEnvironmentSelection | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [duration, setDuration] = useState<5 | 10>(5);
  const [sound, setSound] = useState(false);
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const addOrReplaceProduct = useCallback((image: UploadedImage, slotIndex?: number) => {
    setProductImages((prev) => {
      const next = prev.slice(0, MAX_VIDEO_PRODUCTS);
      if (typeof slotIndex === 'number' && slotIndex >= 0 && slotIndex < MAX_VIDEO_PRODUCTS) {
        if (slotIndex < next.length) {
          next[slotIndex] = image;
          return next;
        }

        next.push(image);
        return next.slice(0, MAX_VIDEO_PRODUCTS);
      }

      if (next.length < MAX_VIDEO_PRODUCTS) {
        return [...next, image];
      }

      const fallback = next.slice();
      fallback[MAX_VIDEO_PRODUCTS - 1] = image;
      return fallback;
    });
  }, []);

  const removeProduct = useCallback((slotIndex: number) => {
    setProductImages((prev) => prev.filter((_, index) => index !== slotIndex));
  }, []);

  // Compatibility alias for legacy call sites while video UI migration settles.
  const referenceImage = productImages[0] ?? null;
  const setReferenceImage = useCallback((image: UploadedImage | null) => {
    setProductImages((prev) => {
      if (!image) {
        return prev.filter((_, index) => index !== 0);
      }

      if (prev.length === 0) {
        return [image];
      }

      const next = [...prev];
      next[0] = image;
      return next.slice(0, MAX_VIDEO_PRODUCTS);
    });
  }, []);

  const resolveFallbackReferenceImage = useCallback(() => {
    if (productImages.length > 0) return productImages[0];
    if (subjectImage) return subjectImage;
    if (environment?.type === 'image') return environment.image;
    return null;
  }, [environment, productImages, subjectImage]);

  const generate = useCallback(async (promptOverride?: string) => {
    const promptSource = (promptOverride ?? prompt).trim();
    if (!promptSource) return 'Please enter a prompt for the video.';

    const environmentHint = getEnvironmentPromptHint(environment);
    const effectivePrompt = environmentHint
      ? `${promptSource} ${environmentHint}`.trim()
      : promptSource;

    setStatus('generating');
    setErrorMsg(null);
    setProgress(0);

    try {
      let composedImage: UploadedImage | null = null;
      try {
        composedImage = await composeVideoReferenceInput({
          productImages,
          subjectImage,
          environment,
          aspectRatio,
        });
      } catch (compositionError) {
        console.warn('Video reference composition failed; using fallback image.', compositionError);
        composedImage = resolveFallbackReferenceImage();
      }

      const res = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageInput: composedImage
            ? { base64: composedImage.base64, mimeType: composedImage.mimeType }
            : undefined,
          prompt: effectivePrompt,
          aspectRatio,
          duration,
          sound,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.code === 'INSUFFICIENT_CREDITS') {
          throw new Error('INSUFFICIENT_CREDITS');
        }
        throw new Error(err.error || 'Video generation failed');
      }

      const { taskId } = await res.json();

      let attempts = 0;
      const MAX_ATTEMPTS = 120; // ~10 minutes at 5s intervals

      pollingRef.current = setInterval(async () => {
        attempts++;
        if (attempts >= MAX_ATTEMPTS) {
          stopPolling();
          setErrorMsg('Video generation timed out. Please try again.');
          setStatus('error');
          return;
        }

        try {
          const statusRes = await fetch(`/api/generate/status?taskId=${taskId}`);
          if (!statusRes.ok) throw new Error('Status check failed');
          const data = await statusRes.json();
          setProgress(data.progress);

          if (data.status === 'completed' && data.resultUrls?.length) {
            stopPolling();
            const url = data.resultUrls[0];
            setVideoUrl(url);
            setStatus('success');
            onCreditsRefresh?.();

            // Persist video to R2 + DB
            try {
              const uploadRes = await fetch('/api/storage/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, mimeType: 'video/mp4', type: 'video' }),
              });
              if (uploadRes.ok) {
                const saved = await uploadRes.json();
                const videoItem = { id: saved.id, url: saved.url, timestamp: saved.timestamp };
                setVideos((prev) => [videoItem, ...prev]);
                onVideoSaved?.(saved);
              } else {
                setVideos((prev) => [
                  { id: crypto.randomUUID(), url, timestamp: Date.now() },
                  ...prev,
                ]);
              }
            } catch {
              setVideos((prev) => [
                { id: crypto.randomUUID(), url, timestamp: Date.now() },
                ...prev,
              ]);
            }
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
  }, [
    prompt,
    environment,
    aspectRatio,
    duration,
    sound,
    stopPolling,
    onCreditsRefresh,
    onVideoSaved,
    productImages,
    resolveFallbackReferenceImage,
    subjectImage,
  ]);

  const removeVideo = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStatus('idle');
    setVideoUrl(null);
    setErrorMsg(null);
    setProgress(0);
  }, [stopPolling]);

  return {
    referenceImage, setReferenceImage,
    productImages, addOrReplaceProduct, removeProduct,
    subjectImage, setSubjectImage,
    environment, setEnvironment,
    prompt, setPrompt,
    aspectRatio, setAspectRatio,
    duration, setDuration,
    sound, setSound,
    status, videoUrl, videos, progress, errorMsg,
    generate, reset, removeVideo,
  };
}
