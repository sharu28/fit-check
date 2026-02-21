'use client';

import { TemplatesExplorer } from '@/components/TemplatesExplorer';

export default function TemplatesPreviewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-[1400px]">
        <TemplatesExplorer onUseTemplate={() => {}} />
      </div>
    </div>
  );
}
