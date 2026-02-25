'use client';

import { useState } from 'react';
import {
  OnboardingQuestionnaire,
  type OnboardingGoal,
  type OnboardingIndustry,
} from '@/components/OnboardingQuestionnaire';

export default function OnboardingQuestionnairePreviewPage() {
  const [isOpen, setIsOpen] = useState(true);
  const [selection, setSelection] = useState<{
    industry: OnboardingIndustry;
    goal: OnboardingGoal;
  } | null>(null);

  return (
    <main className="min-h-screen bg-gray-100 p-4">
      {!isOpen && (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-6">
          <p className="text-sm text-gray-600">Preview closed.</p>
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Reopen Questionnaire
          </button>
          {selection && (
            <p className="mt-3 text-sm text-gray-700">
              Selected: <span className="font-semibold">{selection.industry}</span> /{' '}
              <span className="font-semibold">{selection.goal}</span>
            </p>
          )}
        </div>
      )}

      <OnboardingQuestionnaire
        isOpen={isOpen}
        onSkip={() => setIsOpen(false)}
        onComplete={(nextSelection) => {
          setSelection(nextSelection);
          setIsOpen(false);
        }}
      />
    </main>
  );
}
