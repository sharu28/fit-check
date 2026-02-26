'use client';

import { useEffect, useMemo } from 'react';
import { ResultDisplay } from '@/components/ResultDisplay';
import { AppStatus, type GalleryItem } from '@/types';

export default function ResultActionsPreviewPage() {
  const demoGenerations = useMemo<GalleryItem[]>(
    () => [
      {
        id: 'sample-generation-1',
        url: '/onboarding/industries/jewelry.webp',
        thumbnailUrl: '/onboarding/industries/jewelry.webp',
        base64: '',
        mimeType: 'image/webp',
        timestamp: Date.now(),
        type: 'generation',
      },
      {
        id: 'sample-generation-2',
        url: '/onboarding/industries/garments.webp',
        thumbnailUrl: '/onboarding/industries/garments.webp',
        base64: '',
        mimeType: 'image/webp',
        timestamp: Date.now() - 1000,
        type: 'generation',
      },
    ],
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shouldAutoTap = params.get('autotap') === '1';
    const shouldAutoFocus = params.get('autofocus') === '1';
    let tapInterval: number | null = null;
    const focusTimer = window.setTimeout(() => {
      if (shouldAutoTap) {
        tapInterval = window.setInterval(() => {
          const card = document.querySelector(
            '[data-touch-card-id="sample-generation-1"]',
          ) as HTMLElement | null;
          if (!card) return;

          if (card.getAttribute('data-touch-open') === '1') {
            if (tapInterval !== null) {
              window.clearInterval(tapInterval);
              tapInterval = null;
            }
            return;
          }

          card.click();
        }, 220);
      }

      if (shouldAutoFocus) {
        const shareButton = document.querySelector(
          '[data-touch-card-id="sample-generation-1"] button[aria-label="Share"]',
        ) as HTMLButtonElement | null;
        shareButton?.focus();
      }
    }, 500);

    const cleanupTimer = window.setTimeout(() => {
      if (tapInterval !== null) {
        window.clearInterval(tapInterval);
      }
    }, 2600);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(cleanupTimer);
      if (tapInterval !== null) {
        window.clearInterval(tapInterval);
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
          UI Preview
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">
          Generated Card Actions
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Hover on desktop or tap on touch screens to open image actions.
        </p>
        <div className="mt-6">
          <ResultDisplay
            status={AppStatus.SUCCESS}
            resultImage={null}
            generations={demoGenerations}
            onReset={() => {}}
            onDelete={() => {}}
            onRemoveBg={() => {}}
            onCreateVideo={() => {}}
          />
        </div>
      </div>
    </main>
  );
}
