'use client';

import { useState } from 'react';
import { OnboardingQuickStartFeed } from '@/components/OnboardingQuickStartFeed';

const DEMO_PRIMARY_PREVIEW = '/onboarding/industries/jewelry.webp';
const DEMO_SECONDARY_PREVIEW = '/onboarding/industries/garments.webp';

export default function OnboardingQuickStartPreviewPage() {
  const [hasPrimaryInput, setHasPrimaryInput] = useState(false);
  const [hasSecondaryInput, setHasSecondaryInput] = useState(false);
  const [hidden, setHidden] = useState(false);

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {hidden ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <p className="text-sm text-gray-600">Guide hidden in preview.</p>
            <button
              type="button"
              onClick={() => setHidden(false)}
              className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Show Guide Again
            </button>
          </div>
        ) : (
          <OnboardingQuickStartFeed
            industry="jewelry"
            goal="product-ads"
            hasPrimaryInput={hasPrimaryInput}
            hasSecondaryInput={hasSecondaryInput}
            primaryPreviewUrl={hasPrimaryInput ? DEMO_PRIMARY_PREVIEW : undefined}
            secondaryPreviewUrl={hasSecondaryInput ? DEMO_SECONDARY_PREVIEW : undefined}
            onAddPrimaryInput={() => setHasPrimaryInput(true)}
            onAddSecondaryInput={() => setHasSecondaryInput(true)}
            onOpenTemplates={() => {}}
            onDismiss={() => setHidden(true)}
          />
        )}
      </div>
    </main>
  );
}
