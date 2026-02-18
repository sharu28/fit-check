'use client';

import { useState, useRef, useCallback } from 'react';
import { AppStatus } from '@/types';
import type { UploadedImage, GalleryItem, KieTaskStatus } from '@/types';

interface UseGenerationOptions {
  onGenerationSaved?: (item: GalleryItem) => void;
}

export function useGeneration({ onGenerationSaved }: UseGenerationOptions = {}) {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const pollTaskStatus = useCallback(
    async (taskId: string) => {
      return new Promise<string[]>((resolve, reject) => {
        pollingRef.current = setInterval(async () => {
          try {
            const res = await fetch(`/api/generate/status?taskId=${taskId}`);
            if (!res.ok) throw new Error('Failed to check status');

            const data: KieTaskStatus = await res.json();
            setProgress(data.progress);

            if (data.status === 'completed' && data.resultUrls?.length) {
              stopPolling();
              resolve(data.resultUrls);
            } else if (data.status === 'failed') {
              stopPolling();
              reject(new Error(data.error || 'Generation failed'));
            }
          } catch (e) {
            stopPolling();
            reject(e);
          }
        }, 3000);
      });
    },
    [stopPolling],
  );

  const generateImage = useCallback(
    async (params: {
      personImage: UploadedImage;
      garments: UploadedImage[];
      prompt: string;
      mode: string;
      scene: string;
      visualStyle: string;
      aspectRatio: string;
      resolution: string;
    }) => {
      setStatus(AppStatus.GENERATING);
      setErrorMsg(null);
      setProgress(0);

      try {
        // Submit generation request
        const res = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personImage: {
              base64: params.personImage.base64,
              mimeType: params.personImage.mimeType,
            },
            garments: params.garments.map((g) => ({
              base64: g.base64,
              mimeType: g.mimeType,
            })),
            prompt: params.prompt,
            mode: params.mode,
            scene: params.scene,
            visualStyle: params.visualStyle,
            aspectRatio: params.aspectRatio,
            resolution: params.resolution,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Generation request failed');
        }

        const { taskId } = await res.json();

        // Poll for completion
        const resultUrls = await pollTaskStatus(taskId);
        const imageUrl = resultUrls[0];

        setResultImage(imageUrl);
        setStatus(AppStatus.SUCCESS);

        // Auto-save to gallery (R2 + Supabase)
        if (onGenerationSaved) {
          const localFallback: GalleryItem = {
            id: crypto.randomUUID(),
            url: imageUrl,
            base64: '',
            mimeType: 'image/png',
            timestamp: Date.now(),
            type: 'generation',
          };

          try {
            const uploadRes = await fetch('/api/storage/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                url: imageUrl,
                mimeType: 'image/png',
                type: 'generation',
              }),
            });

            if (!uploadRes.ok) {
              const errBody = await uploadRes.text();
              console.error('Auto-save upload failed:', uploadRes.status, errBody);
              onGenerationSaved(localFallback);
            } else {
              const saved = await uploadRes.json();
              onGenerationSaved(saved);
            }
          } catch (e) {
            console.error('Auto-save network error:', e);
            onGenerationSaved(localFallback);
          }
        }
      } catch (error) {
        console.error(error);
        setErrorMsg(
          error instanceof Error ? error.message : 'Generation failed.',
        );
        setStatus(AppStatus.ERROR);
      }
    },
    [pollTaskStatus, onGenerationSaved],
  );

  const reset = useCallback(() => {
    stopPolling();
    setStatus(AppStatus.IDLE);
    setResultImage(null);
    setErrorMsg(null);
    setProgress(0);
  }, [stopPolling]);

  return {
    status,
    resultImage,
    errorMsg,
    progress,
    generateImage,
    reset,
    setErrorMsg,
  };
}
