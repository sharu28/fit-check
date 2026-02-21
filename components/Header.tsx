'use client';

import Link from 'next/link';
import { Sparkles, LogOut, Coins, Zap } from 'lucide-react';
import { PLAN_CREDITS } from '@/lib/constants';

interface HeaderProps {
  activeSection: 'home' | 'templates' | 'assistant';
  onNavigateHome: () => void;
  onNavigateTemplates: () => void;
  onNavigateAssistant: () => void;
  onSignOut: () => void;
  credits?: number | null;
  plan?: string;
}

export function Header({
  activeSection,
  onNavigateHome,
  onNavigateTemplates,
  onNavigateAssistant,
  onSignOut,
  credits,
  plan = 'free',
}: HeaderProps) {
  const planKey = plan as keyof typeof PLAN_CREDITS;
  const totalCredits = PLAN_CREDITS[planKey] ?? PLAN_CREDITS.free;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  return (
    <>
      {/* Logo + Sign Out */}
      <div className="p-6 border-b border-gray-100 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <Sparkles size={18} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900">
              Fit Check
            </h1>
          </div>
          <button
            onClick={onSignOut}
            className="text-gray-400 hover:text-red-500"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
        {credits != null && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-1.5 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold hover:bg-amber-100 transition-colors"
            title={`${planLabel} plan — ${credits} / ${totalCredits} credits`}
          >
            <Zap size={12} />
            <span>{planLabel}</span>
            <span className="text-amber-300">|</span>
            <Coins size={12} />
            <span>{credits} / {totalCredits}</span>
          </Link>
        )}
      </div>

      {/* App Navigation */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2">
          <button
            onClick={onNavigateHome}
            className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              activeSection === 'home'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={onNavigateTemplates}
            className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              activeSection === 'templates'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            Templates
          </button>
          <button
            onClick={onNavigateAssistant}
            className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
              activeSection === 'assistant'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900'
            }`}
          >
            Assistant
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-2">
          <div className="flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-gray-400">
            <span>Creator Hub</span>
            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] uppercase tracking-wide">
              Coming soon
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-gray-400">
            <span>Earn Money</span>
            <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] uppercase tracking-wide">
              Coming soon
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
