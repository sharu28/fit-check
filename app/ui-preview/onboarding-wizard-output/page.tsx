'use client';

import { OnboardingWizard } from '@/components/OnboardingWizard';

export default function OnboardingWizardOutputPreviewPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <OnboardingWizard
        isOpen
        initialStep={3}
        hasGarment
        hasSubject
        selectedOutput="image"
        onOutputChange={() => {}}
        onUploadGarment={async () => {}}
        onUploadSubject={async () => {}}
        onOpenSubjectLibrary={() => {}}
        onGenerate={() => {}}
        onSkip={() => {}}
      />
    </main>
  );
}
