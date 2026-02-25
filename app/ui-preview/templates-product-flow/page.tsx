'use client';

import { useMemo, useState } from 'react';
import {
  TemplatesExplorer,
  TEMPLATE_OPTIONS,
  type TemplateOption,
} from '@/components/TemplatesExplorer';
import { TemplateIndustryPicker } from '@/components/TemplateIndustryPicker';
import type { OnboardingIndustry } from '@/components/OnboardingQuestionnaire';

export default function TemplatesProductFlowPreviewPage() {
  const defaultTemplate = useMemo(
    () => TEMPLATE_OPTIONS.find((option) => option.id === 'product-ads') ?? TEMPLATE_OPTIONS[0],
    [],
  );
  const [pendingTemplate, setPendingTemplate] = useState<TemplateOption | null>(defaultTemplate);
  const [lastIndustry, setLastIndustry] = useState<OnboardingIndustry>('jewelry');

  return (
    <main className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="mx-auto h-[calc(100vh-1.5rem)] max-w-[1400px]">
        <TemplatesExplorer onUseTemplate={(template) => setPendingTemplate(template)} />
      </div>

      <TemplateIndustryPicker
        isOpen={Boolean(pendingTemplate)}
        templateTitle={pendingTemplate?.title ?? 'Template'}
        initialIndustry={lastIndustry}
        onClose={() => setPendingTemplate(null)}
        onConfirm={(industry) => {
          setLastIndustry(industry);
          setPendingTemplate(null);
        }}
      />
    </main>
  );
}
