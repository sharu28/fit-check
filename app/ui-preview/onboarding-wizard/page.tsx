'use client';

import { useState } from 'react';
import { OnboardingWizard } from '@/components/OnboardingWizard';

export default function OnboardingWizardPreviewPage() {
  const [hasGarment, setHasGarment] = useState(false);
  const [hasSubject, setHasSubject] = useState(false);
  const [garmentPreviewUrl, setGarmentPreviewUrl] = useState<string | undefined>();
  const [subjectPreviewUrl, setSubjectPreviewUrl] = useState<string | undefined>();
  const [selectedOutput, setSelectedOutput] = useState<'image' | 'video'>('image');

  return (
    <main className="min-h-screen bg-gray-100">
      <OnboardingWizard
        isOpen
        hasGarment={hasGarment}
        hasSubject={hasSubject}
        garmentPreviewUrl={garmentPreviewUrl}
        subjectPreviewUrl={subjectPreviewUrl}
        selectedOutput={selectedOutput}
        onOutputChange={setSelectedOutput}
        onUploadGarment={async (file) => {
          setHasGarment(true);
          setGarmentPreviewUrl(URL.createObjectURL(file));
        }}
        onUploadSubject={async (file) => {
          setHasSubject(true);
          setSubjectPreviewUrl(URL.createObjectURL(file));
        }}
        onOpenSubjectLibrary={() => {
          setHasSubject(true);
          setSubjectPreviewUrl(undefined);
        }}
        onGenerate={() => {}}
        onSkip={() => {}}
      />
    </main>
  );
}
