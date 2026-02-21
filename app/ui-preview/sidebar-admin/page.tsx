'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

export default function SidebarAdminPreviewPage() {
  const [activeSection, setActiveSection] = useState<'home' | 'templates' | 'assistant' | 'guide' | 'academy'>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="mx-auto flex h-[92vh] max-w-[1400px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <aside className={`border-r border-gray-200 bg-white transition-all ${isMenuOpen ? 'w-80' : 'w-[78px]'}`}>
          <Header
            activeSection={activeSection}
            isMenuOpen={isMenuOpen}
            onToggleMenu={() => setIsMenuOpen((prev) => !prev)}
            onNavigateHome={() => setActiveSection('home')}
            onNavigateTemplates={() => setActiveSection('templates')}
            onNavigateAssistant={() => setActiveSection('assistant')}
            onNavigateGuide={() => setActiveSection('guide')}
            onNavigateAcademy={() => setActiveSection('academy')}
            onSignOut={() => {}}
            userEmail="sharukesh.seker@gmail.com"
            credits={999999999}
            plan="admin"
          />
        </aside>
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin Preview</h1>
        </main>
      </div>
    </div>
  );
}
