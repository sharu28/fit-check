'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Library,
  Play,
  Sparkles,
  Upload,
  User,
  Wand2,
  X,
} from 'lucide-react';

type OutputChoice = 'image' | 'video';

type WizardStep = 0 | 1 | 2 | 3 | 4;

interface OnboardingWizardProps {
  isOpen: boolean;
  hasGarment: boolean;
  hasSubject: boolean;
  initialStep?: WizardStep;
  garmentPreviewUrl?: string;
  subjectPreviewUrl?: string;
  selectedOutput: OutputChoice;
  onOutputChange: (value: OutputChoice) => void;
  onUploadGarment: (file: File) => void | Promise<void>;
  onUploadSubject: (file: File) => void | Promise<void>;
  onOpenSubjectLibrary: () => void;
  onGenerate: () => void;
  onSkip: () => void;
}

const STEP_TITLES = [
  'Welcome',
  'Add Garment',
  'Choose Subject',
  'Pick Output',
  'Generate',
] as const;

function StepDot({
  index,
  isActive,
  isDone,
  label,
}: {
  index: number;
  isActive: boolean;
  isDone: boolean;
  label: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
          isDone
            ? 'bg-emerald-100 text-emerald-700'
            : isActive
            ? 'bg-gray-900 text-white'
            : 'bg-gray-100 text-gray-500'
        }`}
      >
        {isDone ? <Check size={12} /> : index + 1}
      </span>
      <span className={`text-xs font-semibold uppercase tracking-wide ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
        {label}
      </span>
    </li>
  );
}

export function OnboardingWizard({
  isOpen,
  hasGarment,
  hasSubject,
  initialStep,
  garmentPreviewUrl,
  subjectPreviewUrl,
  selectedOutput,
  onOutputChange,
  onUploadGarment,
  onUploadSubject,
  onOpenSubjectLibrary,
  onGenerate,
  onSkip,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<WizardStep>(0);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const subjectInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setStep(initialStep ?? 0);
  }, [isOpen, initialStep]);

  const canProceed = useMemo(() => {
    if (step === 1) return hasGarment;
    if (step === 2) return hasSubject;
    return true;
  }, [step, hasGarment, hasSubject]);

  const handleNext = () => {
    if (step < 4 && canProceed) setStep((prev) => (prev + 1) as WizardStep);
  };

  const handleBack = () => {
    if (step > 0) setStep((prev) => (prev - 1) as WizardStep);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-[#f3f7f4]/95 p-4 backdrop-blur-sm md:p-8" role="dialog" aria-modal="true" aria-label="Onboarding wizard">
      <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col rounded-3xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.12)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">Quick Start</p>
              <h2 className="text-lg font-semibold text-gray-900">Create your first result</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onSkip}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X size={14} />
            Skip for now
          </button>
        </header>

        <div className="border-b border-gray-200 px-5 py-3 md:px-8">
          <ol className="grid grid-cols-2 gap-2 md:grid-cols-5">
            {STEP_TITLES.map((label, idx) => (
              <StepDot
                key={label}
                index={idx}
                label={label}
                isActive={step === idx}
                isDone={step > idx}
              />
            ))}
          </ol>
        </div>

        <div className="flex-1 px-5 py-6 md:px-8 md:py-8">
          {step === 0 && (
            <section className="mx-auto flex max-w-5xl flex-col items-center text-center">
              <h3 className="text-3xl font-semibold leading-tight text-gray-900 md:text-5xl">
                Make your first look in under 3 minutes.
              </h3>
              <p className="mt-4 max-w-3xl text-lg text-gray-600">
                We guide you through three simple actions so you can generate your first result quickly.
              </p>

              <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <Upload size={22} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Step 1</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">Upload garment</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <User size={22} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Step 2</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">Choose subject</p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-700">
                    <Wand2 size={22} />
                  </span>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">Step 3</p>
                  <p className="mt-1 text-lg font-semibold text-gray-900">Generate</p>
                </div>
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-2xl font-semibold text-gray-900">Step 1: Add clothing photo</h3>
                <p className="mt-2 text-sm text-gray-600">Use a clear photo of one garment on plain background if possible.</p>

                <div className="mt-5 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                  {garmentPreviewUrl ? (
                    <img src={garmentPreviewUrl} alt="Garment preview" className="h-56 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-56 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-400">
                      No garment added yet
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => garmentInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Upload size={16} /> Upload Garment
                </button>
                <input
                  ref={garmentInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onUploadGarment(file);
                  }}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-amber-50 to-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Tips</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>Use good lighting and avoid heavy shadows.</li>
                  <li>Capture the full garment in frame.</li>
                  <li>Avoid cluttered backgrounds.</li>
                </ul>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="grid gap-6 md:grid-cols-[1fr_1fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-2xl font-semibold text-gray-900">Step 2: Choose subject</h3>
                <p className="mt-2 text-sm text-gray-600">Select a model/person photo to apply your garment.</p>

                <button
                  type="button"
                  onClick={() => subjectInputRef.current?.click()}
                  className="mt-5 block w-full rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-left transition hover:border-gray-400 hover:bg-gray-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {subjectPreviewUrl ? (
                    <img src={subjectPreviewUrl} alt="Subject preview" className="h-56 w-full rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center rounded-lg border border-gray-200 bg-white text-center">
                      <p className="text-sm font-semibold text-gray-600">Click to upload subject image</p>
                      <p className="mt-2 text-xs text-gray-400">JPG, PNG, or WEBP</p>
                    </div>
                  )}
                </button>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onOpenSubjectLibrary}
                    className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Library size={16} /> Choose From Library
                  </button>
                </div>
                <input
                  ref={subjectInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onUploadSubject(file);
                  }}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50 to-white p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">Tips</p>
                <ul className="mt-3 space-y-2 text-sm text-gray-700">
                  <li>Front-facing poses usually produce cleaner results.</li>
                  <li>Use a high-quality photo with clear body outline.</li>
                  <li>You can use a preset model from library.</li>
                </ul>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="mx-auto flex w-full max-w-5xl flex-wrap items-start justify-center gap-6">
              <button
                type="button"
                onClick={() => onOutputChange('image')}
                className={`w-[220px] rounded-2xl border p-4 text-left transition sm:w-[250px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedOutput === 'image'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                }`}
              >
                <div
                  className={`aspect-[9/16] w-full rounded-xl border ${
                    selectedOutput === 'image'
                      ? 'border-white/20 bg-gradient-to-b from-white/25 to-white/5'
                      : 'border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50'
                  }`}
                >
                  <div className="flex h-full items-center justify-center">
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedOutput === 'image' ? 'bg-white/15 text-white/90' : 'bg-white text-gray-500'}`}>
                      Image Placeholder
                    </div>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">Image output</h3>
                <p className={`mt-2 text-sm ${selectedOutput === 'image' ? 'text-white/80' : 'text-gray-600'}`}>
                  Fastest path to first value. Great for product pages and social posts.
                </p>
              </button>

              <button
                type="button"
                onClick={() => onOutputChange('video')}
                className={`w-[220px] rounded-2xl border p-4 text-left transition sm:w-[250px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                  selectedOutput === 'video'
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300'
                }`}
              >
                <div
                  className={`aspect-[9/16] w-full rounded-xl border ${
                    selectedOutput === 'video'
                      ? 'border-white/20 bg-gradient-to-b from-white/25 to-white/5'
                      : 'border-gray-200 bg-gradient-to-b from-gray-100 to-gray-50'
                  }`}
                >
                  <div className="flex h-full items-center justify-center">
                    <div className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedOutput === 'video' ? 'bg-white/15 text-white/90' : 'bg-white text-gray-500'}`}>
                      Video Placeholder
                    </div>
                  </div>
                </div>
                <h3 className="mt-3 text-lg font-semibold">Video output</h3>
                <p className={`mt-2 text-sm ${selectedOutput === 'video' ? 'text-white/80' : 'text-gray-600'}`}>
                  Animated results for launch campaigns and short-form content.
                </p>
              </button>
            </section>
          )}

          {step === 4 && (
            <section className="mx-auto max-w-4xl rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-2xl font-semibold text-gray-900">Step 5: Generate your first result</h3>
              <p className="mt-2 text-sm text-gray-600">You are ready. Confirm and start generation.</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Garment</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{hasGarment ? 'Added' : 'Missing'}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Subject</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{hasSubject ? 'Selected' : 'Missing'}</p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Output</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">{selectedOutput === 'image' ? 'Image' : 'Video'}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">Your result will be saved to gallery automatically.</p>
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={!hasGarment || !hasSubject}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Play size={16} /> Generate Now
                </button>
              </div>
            </section>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 0}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Back
          </button>
          {step < 4 && (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Next <ArrowRight size={14} />
            </button>
          )}
          {step === 4 && (
            <p className="text-sm text-gray-500">Need more time? You can skip and return later from Home.</p>
          )}
        </footer>
      </div>
    </div>
  );
}
