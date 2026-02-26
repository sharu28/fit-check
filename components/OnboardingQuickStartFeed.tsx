'use client';

import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Upload,
  X,
} from 'lucide-react';
import type { OnboardingGoal, OnboardingIndustry } from '@/components/OnboardingQuestionnaire';
import {
  ONBOARDING_GOAL_LABELS,
  ONBOARDING_INDUSTRY_LABELS,
} from '@/components/OnboardingQuestionnaire';

interface OnboardingQuickStartFeedProps {
  industry: OnboardingIndustry;
  goal: OnboardingGoal;
  hasPrimaryInput: boolean;
  hasSecondaryInput: boolean;
  primaryPreviewUrl?: string;
  secondaryPreviewUrl?: string;
  onAddPrimaryInput: () => void;
  onAddSecondaryInput: () => void;
  onOpenTemplates: () => void;
  onDismiss: () => void;
}

function isProductFirstIndustry(industry: OnboardingIndustry) {
  return ['jewelry', 'beauty', 'electronics', 'home-goods', 'other'].includes(
    industry,
  );
}

function getPrimaryStepLabel(industry: OnboardingIndustry) {
  if (industry === 'fabrics') return 'Upload fabric or material photo';
  if (isProductFirstIndustry(industry)) return 'Upload product photo';
  return 'Upload product item';
}

function getSecondaryStepLabel(goal: OnboardingGoal) {
  if (goal === 'catalog-listings') return 'Add clean reference frame';
  if (goal === 'editorial-shoot') return 'Add style or model reference';
  return 'Add reference image for scene/style';
}

function getExpectedOutputLabel(goal: OnboardingGoal) {
  switch (goal) {
    case 'product-ads':
      return 'Ad-ready product creative';
    case 'catalog-listings':
      return 'Clean catalog listing visuals';
    case 'editorial-shoot':
      return 'Editorial campaign image';
    case 'influencer-video':
      return 'Short-form creator-style video';
    case 'launch-campaign':
      return 'Launch campaign hero assets';
    case 'whatsapp-status-pack':
      return 'Mobile-first status creatives';
    default:
      return 'Marketing-ready outputs';
  }
}

const QUICK_START_UI = {
  shell:
    'w-full h-full min-h-[560px] rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm',
  heroCard:
    'relative overflow-hidden rounded-3xl border border-indigo-100/80 bg-gradient-to-br from-[#f8fbff] via-white to-[#f8f6ff] p-5 md:p-6 shadow-[0_20px_45px_-28px_rgba(30,41,59,0.55)]',
  heroGlow:
    'pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-indigo-200/40 blur-3xl',
  dropzone:
    'group mt-5 flex min-h-[300px] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-200 bg-white/75 px-5 text-center transition hover:border-indigo-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 md:min-h-[420px]',
  secondaryCard:
    'h-full rounded-2xl border border-gray-200 bg-gray-50/70 p-4 shadow-sm md:p-5',
};

export function OnboardingQuickStartFeed({
  industry,
  goal,
  hasPrimaryInput,
  hasSecondaryInput,
  primaryPreviewUrl,
  secondaryPreviewUrl,
  onAddPrimaryInput,
  onAddSecondaryInput,
  onOpenTemplates,
  onDismiss,
}: OnboardingQuickStartFeedProps) {
  const primaryStep = getPrimaryStepLabel(industry);
  const secondaryStep = getSecondaryStepLabel(goal);
  const outputLabel = getExpectedOutputLabel(goal);

  return (
    <div className={QUICK_START_UI.shell}>
      <div className="flex h-full w-full flex-col">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Personalized Quick Start
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">
              {ONBOARDING_INDUSTRY_LABELS[industry]} x {ONBOARDING_GOAL_LABELS[goal]}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
              <p className="font-medium text-gray-700">You&apos;ll get:</p>
              <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-indigo-700">
                {outputLabel}
              </span>
              <button
                type="button"
                onClick={onOpenTemplates}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                Explore templates <ArrowRight size={12} />
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X size={14} />
            Hide guide
          </button>
        </header>

        <div className="mt-6 grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <article className={QUICK_START_UI.heroCard}>
            <div className={QUICK_START_UI.heroGlow} aria-hidden="true" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
                    Step 1
                  </span>
                  <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-indigo-700">
                    Required
                  </span>
                </div>
                {hasPrimaryInput ? (
                  <CheckCircle2 size={18} className="text-emerald-600" />
                ) : (
                  <Circle size={18} className="text-indigo-300" />
                )}
              </div>

              <h4 className="mt-4 text-xl font-semibold text-gray-900 md:text-2xl">{primaryStep}</h4>

              <button
                type="button"
                onClick={onAddPrimaryInput}
                className={QUICK_START_UI.dropzone}
              >
                {hasPrimaryInput && primaryPreviewUrl ? (
                  <div className="relative h-full w-full overflow-hidden rounded-[18px] border border-indigo-100">
                    <img
                      src={primaryPreviewUrl}
                      alt={`${primaryStep} preview`}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/25 to-black/10" />
                    <div className="absolute inset-x-0 bottom-0 p-4 text-left">
                      <p className="text-base font-semibold text-white md:text-lg">
                        Product photo ready
                      </p>
                      <p className="mt-1 text-xs font-medium text-white/80">
                        Tap to replace
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-100">
                      <Upload size={20} />
                    </span>
                    <p className="mt-4 text-lg font-semibold text-gray-900">
                      {hasPrimaryInput
                        ? 'Product photo ready'
                        : 'Click to upload product photo'}
                    </p>
                  </>
                )}
              </button>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={onAddPrimaryInput}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  {hasPrimaryInput ? 'Change photo' : 'Add input'} <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </article>

          <div className="grid grid-cols-1">
            <article className={`${QUICK_START_UI.secondaryCard} flex flex-col`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Step 2 (Optional)
                </p>
                {hasSecondaryInput ? (
                  <CheckCircle2 size={16} className="text-emerald-600" />
                ) : (
                  <Circle size={16} className="text-gray-400" />
                )}
              </div>
              <h4 className="mt-2 text-base font-semibold text-gray-900">{secondaryStep}</h4>
              <p className="mt-2 text-sm text-gray-600">
                Add a style/scene reference to steer composition. Skip this for a fast first output.
              </p>
              {hasSecondaryInput && secondaryPreviewUrl && (
                <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                  <img
                    src={secondaryPreviewUrl}
                    alt={`${secondaryStep} preview`}
                    className="h-24 w-full object-cover"
                  />
                </div>
              )}
              {!hasSecondaryInput && (
                <div className="mt-3 flex h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
                  Optional reference
                </div>
              )}
              <button
                type="button"
                onClick={onAddSecondaryInput}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                {hasSecondaryInput ? 'Change reference' : 'Add reference'} <ArrowRight size={14} />
              </button>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
