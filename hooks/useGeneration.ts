'use client';

import { useState, useRef, useCallback } from 'react';
import { AppStatus } from '@/types';
import type { UploadedImage, GalleryItem, KieTaskStatus } from '@/types';

interface UseGenerationOptions {
  onGenerationSaved?: (item: GalleryItem) => void;
  onCreditsRefresh?: () => void;
}

export function useGeneration({ onGenerationSaved, onCreditsRefresh }: UseGenerationOptions = {}) {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const pollingRefs = useRef<Set<ReturnType<typeof setInterval>>>(new Set());

  const stopPolling = useCallback(() => {
    pollingRefs.current.forEach((intervalId) => clearInterval(intervalId));
    pollingRefs.current.clear();
  }, []);

  const clearPollingInterval = useCallback((intervalId: ReturnType<typeof setInterval>) => {
    clearInterval(intervalId);
    pollingRefs.current.delete(intervalId);
  }, []);

  const pollTaskStatus = useCallback(
    async (taskId: string, onProgress?: (progress: number) => void) => {
      return new Promise<string[]>((resolve, reject) => {
        let attempts = 0;
        const MAX_ATTEMPTS = 120; // ~6 minutes at 3s intervals

        const intervalId = setInterval(async () => {
          attempts++;
          if (attempts >= MAX_ATTEMPTS) {
            clearPollingInterval(intervalId);
            reject(new Error('Generation timed out. Please try again.'));
            return;
          }

          try {
            const res = await fetch(`/api/generate/status?taskId=${taskId}`);
            if (!res.ok) throw new Error('Failed to check status');

            const data: KieTaskStatus = await res.json();
            onProgress?.(data.progress);

            if (data.status === 'completed' && data.resultUrls?.length) {
              clearPollingInterval(intervalId);
              resolve(data.resultUrls);
            } else if (data.status === 'failed') {
              clearPollingInterval(intervalId);
              reject(new Error(data.error || 'Generation failed'));
            }
          } catch (e) {
            clearPollingInterval(intervalId);
            reject(e);
          }
        }, 3000);

        pollingRefs.current.add(intervalId);
      });
    },
    [clearPollingInterval],
  );

  const generateImage = useCallback(
    async (params: {
      personImage?: UploadedImage | null;
      garments: UploadedImage[];
      prompt: string;
      mode: string;
      scene: string;
      visualStyle: string;
      aspectRatio: string;
      resolution: string;
      numGenerations: number;
    }) => {
      setStatus(AppStatus.GENERATING);
      setErrorMsg(null);
      setProgress(0);

      try {
        const requestBody: Record<string, unknown> = {
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
          numGenerations: params.numGenerations,
        };

        if (params.personImage) {
          requestBody.personImage = {
            base64: params.personImage.base64,
            mimeType: params.personImage.mimeType,
          };
        }

        // Submit generation request
        const res = await fetch('/api/generate/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (err.code === 'INSUFFICIENT_CREDITS') {
            throw new Error('INSUFFICIENT_CREDITS');
          }
          throw new Error(err.error || 'Generation request failed');
        }

        const { taskIds, taskId } = await res.json();
        const normalizedTaskIds: string[] = Array.isArray(taskIds)
          ? taskIds
          : taskId
            ? [taskId]
            : [];

        if (normalizedTaskIds.length === 0) {
          throw new Error('No generation task was returned');
        }

        // Poll all tasks and report average progress
        const taskProgresses = Array(normalizedTaskIds.length).fill(0);
        const updateAverageProgress = (index: number, value: number) => {
          taskProgresses[index] = value;
          const total = taskProgresses.reduce((sum, p) => sum + p, 0);
          setProgress(total / taskProgresses.length);
        };

        const taskResults = await Promise.all(
          normalizedTaskIds.map((id, index) =>
            pollTaskStatus(id, (taskProgress) =>
              updateAverageProgress(index, taskProgress),
            ),
          ),
        );

        const resultUrls = taskResults.flat();
        const imageUrl = resultUrls[0];
        if (!imageUrl) {
          throw new Error('Generation completed but returned no images');
        }
        let displayResultUrl = imageUrl;

        // Auto-save all generated results to gallery (R2 + Supabase)
        if (onGenerationSaved) {
          for (const [index, url] of resultUrls.entries()) {
            const localFallback: GalleryItem = {
              id: crypto.randomUUID(),
              url,
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
                  url,
                  mimeType: 'image/png',
                  type: 'generation',
                }),
              });

              if (!uploadRes.ok) {
                const errBody = await uploadRes.text();
                console.error('Auto-save upload failed:', uploadRes.status, errBody);
                onGenerationSaved(localFallback);
                if (index === 0) {
                  displayResultUrl = localFallback.url;
                }
              } else {
                const saved = await uploadRes.json();
                onGenerationSaved(saved);
                if (index === 0 && saved?.url) {
                  displayResultUrl = saved.url;
                }
              }
            } catch (e) {
              console.error('Auto-save network error:', e);
              onGenerationSaved(localFallback);
              if (index === 0) {
                displayResultUrl = localFallback.url;
              }
            }
          }
        }

        setResultImage(displayResultUrl);
        setStatus(AppStatus.SUCCESS);
        onCreditsRefresh?.();
      } catch (error) {
        console.error(error);
        setErrorMsg(
          error instanceof Error ? error.message : 'Generation failed.',
        );
        setStatus(AppStatus.ERROR);
      }
    },
    [pollTaskStatus, onGenerationSaved, onCreditsRefresh],
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
