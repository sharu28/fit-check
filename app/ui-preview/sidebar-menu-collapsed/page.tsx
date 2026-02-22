'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

export default function SidebarMenuCollapsedPreviewPage() {
  const [activeSection, setActiveSection] = useState<'home' | 'templates' | 'assistant' | 'guide' | 'academy'>('templates');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTool, setCurrentTool] = useState<'style-studio' | 'video-generator' | 'bg-remover'>('style-studio');

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="mx-auto flex h-[92vh] max-w-[1400px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <aside className={`border-r border-gray-200 bg-white transition-all ${isMenuOpen ? 'w-80' : 'w-[78px]'}`}>
          <Header
            activeSection={activeSection}
            currentTool={currentTool}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onNavigateHome={() => setActiveSection('home')}
            onNavigateImage={() => {
              setCurrentTool('style-studio');
              setActiveSection('home');
            }}
            onNavigateVideo={() => {
              setCurrentTool('video-generator');
              setActiveSection('home');
            }}
            onNavigateTemplates={() => setActiveSection('templates')}
            onNavigateAssistant={() => setActiveSection('assistant')}
            onNavigateGuide={() => setActiveSection('guide')}
            onNavigateAcademy={() => setActiveSection('academy')}
            onSignOut={() => {}}
            userEmail="demo@fitcheck.ai"
            credits={8}
            plan="free"
          />
        </aside>
        <main className="flex-1 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Preview</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">Collapsed menu</h1>
        </main>
      </div>
    </div>
  );
}
