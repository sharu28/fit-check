'use client';

import { ResultDisplay } from '@/components/ResultDisplay';
import { AppStatus } from '@/types';

export default function ResultLoadingPreviewPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <ResultDisplay
          status={AppStatus.GENERATING}
          resultImage={null}
          generations={[]}
          pendingCount={2}
          progress={0.42}
          onReset={() => {}}
          onDelete={() => {}}
        />
      </div>
    </main>
  );
}
