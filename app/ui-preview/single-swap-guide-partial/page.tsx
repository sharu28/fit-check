'use client';

import { SingleSwapGuide } from '@/components/SingleSwapGuide';

export default function SingleSwapGuidePartialPreviewPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <SingleSwapGuide
          hasGarment={false}
          hasSubject
          onAddGarment={() => {}}
          onAddSubject={() => {}}
        />
      </div>
    </main>
  );
}
