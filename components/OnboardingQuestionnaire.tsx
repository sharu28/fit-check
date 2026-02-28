'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Clapperboard, Sparkles, X } from 'lucide-react';

export type OnboardingIndustry =
  | 'garments'
  | 'fabrics'
  | 'jewelry'
  | 'footwear'
  | 'bags'
  | 'beauty'
  | 'electronics'
  | 'home-goods'
  | 'other';

export type OnboardingGoal =
  | 'product-ads'
  | 'catalog-listings'
  | 'editorial-shoot'
  | 'influencer-video'
  | 'launch-campaign'
  | 'whatsapp-status-pack';

export const ONBOARDING_INDUSTRY_LABELS: Record<OnboardingIndustry, string> = {
  garments: 'Garments',
  fabrics: 'Fabrics & Textiles',
  jewelry: 'Jewelry & Accessories',
  footwear: 'Footwear',
  bags: 'Bags & Leather Goods',
  beauty: 'Beauty & Cosmetics',
  electronics: 'Electronics',
  'home-goods': 'Home Goods',
  other: 'Other Wholesale Products',
};

export const ONBOARDING_GOAL_LABELS: Record<OnboardingGoal, string> = {
  'product-ads': 'Product Ads',
  'catalog-listings': 'Catalog / Marketplace Listings',
  'editorial-shoot': 'Editorial Shoot',
  'influencer-video': 'Influencer Style Video',
  'launch-campaign': 'Launch Campaign',
  'whatsapp-status-pack': 'WhatsApp Status Pack',
};

const INDUSTRY_OPTIONS: Array<{
  id: OnboardingIndustry;
  accentClass: string;
}> = [
  { id: 'garments', accentClass: 'from-amber-300/70 via-orange-200/60 to-rose-300/60' },
  { id: 'fabrics', accentClass: 'from-indigo-300/70 via-violet-200/60 to-fuchsia-300/60' },
  { id: 'jewelry', accentClass: 'from-yellow-300/70 via-amber-200/60 to-orange-300/60' },
  { id: 'footwear', accentClass: 'from-cyan-300/70 via-blue-200/60 to-indigo-300/60' },
  { id: 'bags', accentClass: 'from-emerald-300/70 via-teal-200/60 to-cyan-300/60' },
  { id: 'beauty', accentClass: 'from-pink-300/70 via-rose-200/60 to-red-300/60' },
  { id: 'electronics', accentClass: 'from-slate-300/70 via-gray-200/60 to-zinc-300/60' },
  { id: 'home-goods', accentClass: 'from-lime-300/70 via-green-200/60 to-emerald-300/60' },
  { id: 'other', accentClass: 'from-sky-300/70 via-indigo-200/60 to-violet-300/60' },
];

const GOAL_OPTIONS: Array<{
  id: OnboardingGoal;
  outputType: 'Image-first' | 'Video-first' | 'Mixed';
  accentClass: string;
  description: string;
}> = [
  {
    id: 'product-ads',
    outputType: 'Image-first',
    accentClass: 'from-fuchsia-300/70 via-pink-200/60 to-rose-300/60',
    description: 'Styled shots of your product on a model. Perfect for social ads and campaigns.',
  },
  {
    id: 'catalog-listings',
    outputType: 'Image-first',
    accentClass: 'from-slate-300/70 via-zinc-200/60 to-stone-300/60',
    description: 'Clean on-model product images for your store, Amazon, or marketplace.',
  },
  {
    id: 'editorial-shoot',
    outputType: 'Image-first',
    accentClass: 'from-violet-300/70 via-indigo-200/60 to-sky-300/60',
    description: 'Magazine-style creative imagery with a strong visual narrative.',
  },
  {
    id: 'influencer-video',
    outputType: 'Video-first',
    accentClass: 'from-cyan-300/70 via-sky-200/60 to-indigo-300/60',
    description: 'Short video showing your product worn or used, influencer-style.',
  },
  {
    id: 'launch-campaign',
    outputType: 'Mixed',
    accentClass: 'from-orange-300/70 via-amber-200/60 to-yellow-300/60',
    description: 'A mix of images and videos to announce a new product or collection.',
  },
  {
    id: 'whatsapp-status-pack',
    outputType: 'Mixed',
    accentClass: 'from-emerald-300/70 via-lime-200/60 to-teal-300/60',
    description: 'Thumb-stopping vertical content for WhatsApp status and Stories.',
  },
];

function getAssetBackgroundImage(path: string) {
  return [
    `url(${path}.webp)`,
    `url(${path}.jpg)`,
    `url(${path}.jpeg)`,
    `url(${path}.png)`,
  ].join(', ');
}

function getIndustryAsset(industry: OnboardingIndustry) {
  return getAssetBackgroundImage(`/onboarding/industries/${industry}`);
}

function getGoalAsset(goal: OnboardingGoal) {
  return getAssetBackgroundImage(`/onboarding/goals/${goal}`);
}

interface OnboardingQuestionnaireProps {
  isOpen: boolean;
  onSkip: () => void;
  onComplete: (selection: {
    industry: OnboardingIndustry;
    goal: OnboardingGoal;
  }) => void;
}

export function OnboardingQuestionnaire({
  isOpen,
  onSkip,
  onComplete,
}: OnboardingQuestionnaireProps) {
  const [step, setStep] = useState<0 | 1>(0);
  const [industry, setIndustry] = useState<OnboardingIndustry | null>(null);
  const [goal, setGoal] = useState<OnboardingGoal | null>(null);

  const canContinue = step === 0 ? Boolean(industry) : Boolean(goal);
  const selectedIndustryLabel = industry ? ONBOARDING_INDUSTRY_LABELS[industry] : '';
  const selectedGoalLabel = goal ? ONBOARDING_GOAL_LABELS[goal] : '';

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setIndustry(null);
    setGoal(null);
  }, [isOpen]);

  const summaryText = useMemo(() => {
    if (!industry || !goal) return '';
    return `You sell ${ONBOARDING_INDUSTRY_LABELS[industry]} and want ${ONBOARDING_GOAL_LABELS[goal]}.`;
  }, [industry, goal]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-[#f3f7f4]/95 p-4 backdrop-blur-sm md:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Business onboarding questionnaire"
    >
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.12)] md:h-[calc(100vh-4rem)]">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 md:px-8 md:py-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-white">
              <Sparkles size={16} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
                Quick Setup
              </p>
              <h2 className="text-lg font-semibold text-gray-900">
                Tell us what you sell
              </h2>
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
          <ol className="grid grid-cols-2 gap-2">
            <li className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  step === 0 ? 'bg-gray-900 text-white' : industry ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {industry && step > 0 ? <Check size={12} /> : 1}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${step === 0 ? 'text-gray-900' : 'text-gray-500'}`}>
                Industry
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  step === 1 ? 'bg-gray-900 text-white' : goal ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {goal ? <Check size={12} /> : 2}
              </span>
              <span className={`text-xs font-semibold uppercase tracking-wide ${step === 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                Content Goal
              </span>
            </li>
          </ol>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 custom-scrollbar md:px-8 md:py-8">
          {step === 0 ? (
            <section>
              <div className="mb-5">
                <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                  What products do you sell?
                </h3>
                <p className="mt-2 text-sm text-gray-600 md:text-base">
                  Select your business category so we can prepare relevant templates and prompts.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {INDUSTRY_OPTIONS.map((option) => {
                  const selected = industry === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setIndustry(option.id)}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        selected
                          ? 'border-gray-900 ring-2 ring-gray-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-[5/4] w-full">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${option.accentClass}`}
                        />
                        <div
                          className="absolute inset-0 opacity-45"
                          style={{
                            backgroundImage: getIndustryAsset(option.id),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-105 bg-gradient-to-tr from-transparent via-white/15 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <p className="text-base font-semibold text-white">
                            {ONBOARDING_INDUSTRY_LABELS[option.id]}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ) : (
            <section>
              <div className="mb-5">
                <h3 className="text-2xl font-semibold text-gray-900 md:text-3xl">
                  What do you want to create first?
                </h3>
                <p className="mt-2 text-sm text-gray-600 md:text-base">
                  Choose your first content outcome for the fastest time to value.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {GOAL_OPTIONS.map((option) => {
                  const selected = goal === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setGoal(option.id)}
                      className={`group relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                        selected
                          ? 'border-gray-900 ring-2 ring-gray-900/20'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="aspect-[5/4] w-full">
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${option.accentClass}`}
                        />
                        <div
                          className="absolute inset-0 opacity-50"
                          style={{
                            backgroundImage: getGoalAsset(option.id),
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                          aria-hidden="true"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute inset-0 animate-pulse bg-gradient-to-tr from-transparent via-white/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-base font-semibold text-white">
                              {ONBOARDING_GOAL_LABELS[option.id]}
                            </p>
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90">
                              {option.outputType}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs leading-snug text-white/70">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50 via-cyan-50 to-white p-4 md:p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Recommended setup
                </p>
                <p className="mt-2 text-sm font-semibold text-gray-900 md:text-base">
                  {summaryText || 'Select industry and content goal to preview your setup.'}
                </p>
                {industry && goal && (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                      <Building2 size={12} />
                      {selectedIndustryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-gray-700">
                      <Clapperboard size={12} />
                      {selectedGoalLabel}
                    </span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>

        <footer className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={() => setStep(0)}
            disabled={step === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {step === 0 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (industry && goal) {
                  onComplete({ industry, goal });
                }
              }}
              disabled={!industry || !goal}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Set Up My Workspace <ArrowRight size={14} />
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}

