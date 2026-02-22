'use client';

import { OnboardingWizard } from '@/components/OnboardingWizard';

export default function OnboardingWizardSubjectPreviewPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <OnboardingWizard
        isOpen
        initialStep={2}
        hasGarment
        hasSubject={false}
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
