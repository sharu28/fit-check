'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import {
  ONBOARDING_INDUSTRY_LABELS,
  type OnboardingIndustry,
} from '@/components/OnboardingQuestionnaire';

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

interface TemplateIndustryPickerProps {
  isOpen: boolean;
  templateTitle: string;
  initialIndustry: OnboardingIndustry;
  onClose: () => void;
  onConfirm: (industry: OnboardingIndustry) => void;
}

export function TemplateIndustryPicker({
  isOpen,
  templateTitle,
  initialIndustry,
  onClose,
  onConfirm,
}: TemplateIndustryPickerProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<OnboardingIndustry>(initialIndustry);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIndustry(initialIndustry);
  }, [initialIndustry, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose product type for template"
    >
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] md:h-[calc(100vh-3rem)]">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Template Setup
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 md:text-2xl">
              Choose your product type
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We will adapt <span className="font-semibold text-gray-800">{templateTitle}</span> prompt for your business.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X size={14} />
            Cancel
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 custom-scrollbar md:px-8 md:py-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INDUSTRY_OPTIONS.map((option) => {
              const selected = selectedIndustry === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedIndustry(option.id)}
                  className={`group relative overflow-hidden rounded-2xl border text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    selected
                      ? 'border-gray-900 ring-2 ring-gray-900/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="aspect-[5/4] w-full">
                    <div className={`absolute inset-0 bg-gradient-to-br ${option.accentClass}`} />
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
        </div>

        <footer className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 md:px-8">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedIndustry)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            Continue <ArrowRight size={14} />
          </button>
        </footer>
      </div>
    </div>
  );
}
