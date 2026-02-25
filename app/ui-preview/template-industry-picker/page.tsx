'use client';

import { useState } from 'react';
import { TemplateIndustryPicker } from '@/components/TemplateIndustryPicker';
import type { OnboardingIndustry } from '@/components/OnboardingQuestionnaire';

export default function TemplateIndustryPickerPreviewPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<OnboardingIndustry>('jewelry');

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      {!isOpen && (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-700">
            Selected: <span className="font-semibold">{selectedIndustry}</span>
          </p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Reopen Picker
          </button>
        </div>
      )}

      <TemplateIndustryPicker
        isOpen={isOpen}
        templateTitle="Product Ads"
        initialIndustry={selectedIndustry}
        onClose={() => setIsOpen(false)}
        onConfirm={(industry) => {
          setSelectedIndustry(industry);
          setIsOpen(false);
        }}
      />
    </main>
  );
}
