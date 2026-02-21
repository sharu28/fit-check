'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';

export default function SidebarMenuPreviewPage() {
  const [activeSection, setActiveSection] = useState<'home' | 'templates' | 'assistant'>('templates');

  return (
    <div className="min-h-screen bg-gray-100 p-3 md:p-6">
      <div className="mx-auto flex h-[92vh] max-w-[1400px] overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <aside className="w-80 border-r border-gray-200 bg-white">
          <Header
            activeSection={activeSection}
            onNavigateHome={() => setActiveSection('home')}
            onNavigateTemplates={() => setActiveSection('templates')}
            onNavigateAssistant={() => setActiveSection('assistant')}
            onSignOut={() => {}}
            credits={8}
            plan="free"
          />
        </aside>
        <main className="flex-1 p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Preview</p>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">{activeSection} screen</h1>
          <p className="mt-3 text-sm text-gray-600">Sidebar navigation rows are text-only and sectioned, with coming-soon tags.</p>
        </main>
      </div>
    </div>
  );
}
