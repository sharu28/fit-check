'use client';

import Link from 'next/link';
import {
  Sparkles,
  LogOut,
  Coins,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  House,
  LayoutTemplate,
  Bot,
  BookOpen,
  GraduationCap,
  User,
  Image as ImageIcon,
  Video,
} from 'lucide-react';
import type { ToolMode } from '@/types';
import { PLAN_CREDITS } from '@/lib/constants';

interface HeaderProps {
  activeSection: 'home' | 'templates' | 'assistant' | 'guide' | 'academy';
  currentTool: ToolMode;
  isOnboardingOpen: boolean;
  isMenuOpen: boolean;
  onToggleMenu: () => void;
  onNavigateHome: () => void;
  onNavigateImage: () => void;
  onNavigateVideo: () => void;
  onNavigateTemplates: () => void;
  onNavigateAssistant: () => void;
  onNavigateGuide: () => void;
  onNavigateOnboarding: () => void;
  onNavigateAcademy: () => void;
  onSignOut: () => void;
  userEmail?: string;
  credits?: number | null;
  plan?: string;
}

export function Header({
  activeSection,
  currentTool,
  isOnboardingOpen,
  isMenuOpen,
  onToggleMenu,
  onNavigateHome,
  onNavigateImage,
  onNavigateVideo,
  onNavigateTemplates,
  onNavigateAssistant,
  onNavigateGuide,
  onNavigateOnboarding,
  onNavigateAcademy,
  onSignOut,
  userEmail,
  credits,
  plan = 'free',
}: HeaderProps) {
  const normalizedPlan = plan.toLowerCase();
  const isAdminPlan = normalizedPlan === 'admin';
  const planKey = normalizedPlan as keyof typeof PLAN_CREDITS;
  const totalCredits = PLAN_CREDITS[planKey] ?? PLAN_CREDITS.free;
  const planLabel = isAdminPlan
    ? 'Admin'
    : normalizedPlan.charAt(0).toUpperCase() + normalizedPlan.slice(1);
  const initial = (userEmail?.trim()?.[0] ?? 'U').toUpperCase();

  const navButtonClass = (active: boolean) =>
    `w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'
    }`;
  const collapsedNavButtonClass = (active: boolean) =>
    `flex w-full items-center justify-center rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
      active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-white hover:text-gray-900'
    }`;
  const isImageActive = activeSection === 'home' && currentTool === 'style-studio';
  const isVideoActive = activeSection === 'home' && currentTool === 'video-generator';
  const isHomeActive = activeSection === 'home' && !isImageActive && !isVideoActive;

  return (
    <div className="flex h-full flex-col">
      <div>
        <div className="border-b border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-black p-1.5 text-white">
                <Sparkles size={16} />
              </div>
              {isMenuOpen && (
                <h1 className="text-lg font-bold tracking-tight text-gray-900">Fit Check</h1>
              )}
            </div>
            <button
              onClick={onToggleMenu}
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              title={isMenuOpen ? 'Collapse menu' : 'Expand menu'}
            >
              {isMenuOpen ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </div>
          {isMenuOpen && credits != null && (
            <Link
              href="/pricing"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 py-1.5 text-xs font-bold text-amber-700 transition-colors hover:bg-amber-100"
              title={
                isAdminPlan
                  ? 'Admin plan - unlimited credits'
                  : `${planLabel} plan - ${credits} / ${totalCredits} credits`
              }
            >
              <Zap size={12} />
              <span>{planLabel}</span>
              <span className="text-amber-300">|</span>
              <Coins size={12} />
              <span>{isAdminPlan ? 'Unlimited' : `${credits} / ${totalCredits}`}</span>
            </Link>
          )}
        </div>

        <nav className={`border-b border-gray-100 ${isMenuOpen ? 'px-4 py-4' : 'px-3 py-4'}`}>
          {isMenuOpen ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2">
                <button onClick={onNavigateHome} className={navButtonClass(isHomeActive)}>
                  Home
                </button>
                <button onClick={onNavigateGuide} className={`mt-1 ${navButtonClass(activeSection === 'guide')}`}>
                  Guide
                </button>
                <button onClick={onNavigateImage} className={`mt-1 ${navButtonClass(isImageActive)}`}>
                  Image
                </button>
                <button onClick={onNavigateVideo} className={`mt-1 ${navButtonClass(isVideoActive)}`}>
                  Video
                </button>
                <button onClick={onNavigateTemplates} className={`mt-1 ${navButtonClass(activeSection === 'templates')}`}>
                  Templates
                </button>
                <button onClick={onNavigateAssistant} className={`mt-1 ${navButtonClass(activeSection === 'assistant')}`}>
                  Assistant
                </button>
                <button onClick={onNavigateOnboarding} className={`mt-1 ${navButtonClass(isOnboardingOpen)}`}>
                  Onboarding
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-2">
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
            </>
          ) : (
            <div className="space-y-2">
              <button onClick={onNavigateHome} className={collapsedNavButtonClass(isHomeActive)} aria-label="Home" title="Home">
                <House size={17} />
              </button>
              <button onClick={onNavigateGuide} className={collapsedNavButtonClass(activeSection === 'guide')} aria-label="Guide" title="Guide">
                <BookOpen size={17} />
              </button>
              <button onClick={onNavigateImage} className={collapsedNavButtonClass(isImageActive)} aria-label="Image tool" title="Image">
                <ImageIcon size={17} />
              </button>
              <button onClick={onNavigateVideo} className={collapsedNavButtonClass(isVideoActive)} aria-label="Video tool" title="Video">
                <Video size={17} />
              </button>
              <button onClick={onNavigateTemplates} className={collapsedNavButtonClass(activeSection === 'templates')} aria-label="Templates" title="Templates">
                <LayoutTemplate size={17} />
              </button>
              <button onClick={onNavigateAssistant} className={collapsedNavButtonClass(activeSection === 'assistant')} aria-label="Assistant" title="Assistant">
                <Bot size={17} />
              </button>
              <button onClick={onNavigateOnboarding} className={collapsedNavButtonClass(isOnboardingOpen)} aria-label="Onboarding guide" title="Onboarding guide">
                <Sparkles size={17} />
              </button>
            </div>
          )}
        </nav>
      </div>

      <div className={`mt-auto ${isMenuOpen ? 'p-4' : 'p-3'}`}>
        {isMenuOpen ? (
          <>
            <button
              onClick={onNavigateAcademy}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                activeSection === 'academy'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              Academy
            </button>

            <button
              onClick={onSignOut}
              className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              <span className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-semibold text-white">
                  {initial}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-900">
                    {userEmail ?? 'Profile'}
                  </span>
                  <span className="block text-xs text-gray-500">Sign out</span>
                </span>
              </span>
              <LogOut size={14} className="text-gray-500" />
            </button>
          </>
        ) : (
          <div className="space-y-2">
            <button
              onClick={onNavigateAcademy}
              className={`flex w-full items-center justify-center rounded-xl px-3 py-2.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                activeSection === 'academy'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
              aria-label="Academy"
              title="Academy"
            >
              <GraduationCap size={17} />
            </button>
            <button
              onClick={onSignOut}
              className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-gray-700 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              aria-label="Profile"
              title={userEmail ?? 'Profile'}
            >
              <User size={17} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
