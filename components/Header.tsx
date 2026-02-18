'use client';

import Link from 'next/link';
import { Sparkles, LogOut, Wand2, Video, Coins, Zap } from 'lucide-react';
import type { ToolMode } from '@/types';
import { PLAN_CREDITS } from '@/lib/constants';

interface HeaderProps {
  currentTool: ToolMode;
  onToolChange: (tool: ToolMode) => void;
  onSignOut: () => void;
  credits?: number | null;
  plan?: string;
}

export function Header({
  currentTool,
  onToolChange,
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

      {/* Tool Switcher */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => onToolChange('style-studio')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              currentTool === 'style-studio'
                ? 'bg-white shadow-sm text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wand2 size={14} /> Virtual Try-On
          </button>
          <button
            onClick={() => onToolChange('video-generator')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
              currentTool === 'video-generator'
                ? 'bg-white shadow-sm text-black'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Video size={14} /> Video
          </button>
        </div>
      </div>
    </>
  );
}
