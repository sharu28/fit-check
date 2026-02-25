'use client';

import { ArrowRight, CheckCircle2, Circle, Layers3, Sparkles, X } from 'lucide-react';
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

function getGoalAsset(goal: OnboardingGoal) {
  const basePath = `/onboarding/goals/${goal}`;
  return [
    `url(${basePath}.webp)`,
    `url(${basePath}.jpg)`,
    `url(${basePath}.jpeg)`,
    `url(${basePath}.png)`,
  ].join(', ');
}

export function OnboardingQuickStartFeed({
  industry,
  goal,
  hasPrimaryInput,
  hasSecondaryInput,
  onAddPrimaryInput,
  onAddSecondaryInput,
  onOpenTemplates,
  onDismiss,
}: OnboardingQuickStartFeedProps) {
  const primaryStep = getPrimaryStepLabel(industry);
  const secondaryStep = getSecondaryStepLabel(goal);
  const outputLabel = getExpectedOutputLabel(goal);

  return (
    <div className="w-full h-full min-h-[430px] rounded-2xl border border-gray-200 bg-white p-5 md:p-7 shadow-sm">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Personalized Quick Start
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-gray-900 md:text-3xl">
              {ONBOARDING_INDUSTRY_LABELS[industry]} x {ONBOARDING_GOAL_LABELS[goal]}
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Follow this sequence for the fastest first result based on your selections.
            </p>
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

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Step 1
              </p>
              {hasPrimaryInput ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <Circle size={16} className="text-gray-400" />
              )}
            </div>
            <h4 className="mt-2 text-base font-semibold text-gray-900">{primaryStep}</h4>
            <button
              type="button"
              onClick={onAddPrimaryInput}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Add input <ArrowRight size={14} />
            </button>
          </article>

          <article className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Step 2
              </p>
              {hasSecondaryInput ? (
                <CheckCircle2 size={16} className="text-emerald-600" />
              ) : (
                <Circle size={16} className="text-gray-400" />
              )}
            </div>
            <h4 className="mt-2 text-base font-semibold text-gray-900">{secondaryStep}</h4>
            <button
              type="button"
              onClick={onAddSecondaryInput}
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Add reference <ArrowRight size={14} />
            </button>
          </article>

          <article className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 p-4 text-white">
            <div
              className="absolute inset-0 opacity-50"
              style={{
                backgroundImage: getGoalAsset(goal),
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                Expected Output
              </p>
              <h4 className="mt-2 text-base font-semibold">{outputLabel}</h4>
              <button
                type="button"
                onClick={onOpenTemplates}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Layers3 size={14} />
                Explore templates
              </button>
            </div>
          </article>
        </div>

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          <span className="inline-flex items-center gap-2 font-semibold">
            <Sparkles size={14} />
            Your prompt and workflow are pre-configured from onboarding.
          </span>
        </div>
      </div>
    </div>
  );
}
