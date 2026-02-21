'use client';

import { useMemo, useState } from 'react';
import {
  Search,
  Globe,
  Megaphone,
  Sparkles,
  Wand2,
  RotateCcw,
  BookOpen,
  Clapperboard,
  CalendarClock,
  Store,
} from 'lucide-react';

export interface TemplateOption {
  id: string;
  title: string;
  category: string;
  format: 'image' | 'video' | 'mixed';
  description: string;
  defaultPrompt: string;
  targetTool: 'style-studio' | 'video-generator';
  accentClass: string;
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'website-shoot',
    title: 'Website Shoot',
    category: 'website',
    format: 'image',
    description: 'Crisp storefront-ready model shots with clean composition.',
    defaultPrompt: 'Create polished ecommerce hero images with studio lighting and clean framing.',
    targetTool: 'style-studio',
    accentClass: 'from-slate-200 via-slate-300 to-zinc-200',
  },
  {
    id: 'social-campaign',
    title: 'Social Media Campaign',
    category: 'social',
    format: 'mixed',
    description: 'Platform-first visuals tailored for feeds, reels, and stories.',
    defaultPrompt: 'Generate bold campaign visuals with social-first framing, energetic styling, and trend-driven composition.',
    targetTool: 'style-studio',
    accentClass: 'from-indigo-300 via-fuchsia-300 to-rose-300',
  },
  {
    id: 'product-ads',
    title: 'Product Ads',
    category: 'ads',
    format: 'mixed',
    description: 'Conversion-focused ad-ready frames with premium product emphasis.',
    defaultPrompt: 'Design ad-ready fashion visuals that highlight garment details and conversion-focused composition.',
    targetTool: 'style-studio',
    accentClass: 'from-amber-200 via-orange-200 to-red-200',
  },
  {
    id: 'background-change',
    title: 'Change Your Background',
    category: 'background',
    format: 'image',
    description: 'Swap environments fast for studio, street, editorial, or seasonal sets.',
    defaultPrompt: 'Replace the background with a premium branded set while preserving realistic lighting and shadows.',
    targetTool: 'style-studio',
    accentClass: 'from-cyan-200 via-blue-200 to-slate-200',
  },
  {
    id: 'rotation-360',
    title: '360 Rotation',
    category: 'rotation',
    format: 'video',
    description: 'Show garments from every angle with smooth rotational camera movement.',
    defaultPrompt: 'Create a smooth 360-degree product showcase rotation with clean lighting and consistent pace.',
    targetTool: 'video-generator',
    accentClass: 'from-emerald-200 via-teal-200 to-cyan-200',
  },
  {
    id: 'lookbook-editorial',
    title: 'Lookbook Editorial',
    category: 'lookbook',
    format: 'image',
    description: 'High-fashion editorial layouts for seasonal collections.',
    defaultPrompt: 'Create an editorial lookbook aesthetic with intentional styling, dramatic lighting, and premium art direction.',
    targetTool: 'style-studio',
    accentClass: 'from-violet-200 via-fuchsia-200 to-pink-200',
  },
  {
    id: 'ugc-reels',
    title: 'UGC / Reels',
    category: 'social',
    format: 'video',
    description: 'Authentic creator-style clips built for engagement and retention.',
    defaultPrompt: 'Generate a UGC-style fashion reel with natural motion, creator framing, and social-native pacing.',
    targetTool: 'video-generator',
    accentClass: 'from-blue-200 via-indigo-200 to-purple-200',
  },
  {
    id: 'seasonal-drop',
    title: 'Seasonal Drops',
    category: 'seasonal',
    format: 'mixed',
    description: 'Holiday and campaign-ready concepts for launch windows.',
    defaultPrompt: 'Generate seasonal launch visuals with cohesive art direction and campaign storytelling.',
    targetTool: 'style-studio',
    accentClass: 'from-rose-200 via-red-200 to-amber-200',
  },
  {
    id: 'marketplace-listings',
    title: 'Marketplace Listings',
    category: 'marketplace',
    format: 'image',
    description: 'Clean listing-compliant assets for marketplaces and catalogs.',
    defaultPrompt: 'Create compliant product listing images with neutral backgrounds and accurate garment detail.',
    targetTool: 'style-studio',
    accentClass: 'from-zinc-200 via-stone-200 to-neutral-300',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  website: 'Website Shoot',
  social: 'Social Campaign',
  ads: 'Product Ads',
  background: 'Change Background',
  rotation: '360 Rotation',
  lookbook: 'Lookbook',
  seasonal: 'Seasonal Drops',
  marketplace: 'Marketplace',
};

const CATEGORY_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  social: Megaphone,
  ads: Sparkles,
  background: Wand2,
  rotation: RotateCcw,
  lookbook: BookOpen,
  seasonal: CalendarClock,
  marketplace: Store,
};

interface TemplatesExplorerProps {
  onUseTemplate: (template: TemplateOption) => void;
}

export function TemplatesExplorer({ onUseTemplate }: TemplatesExplorerProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeFormat, setActiveFormat] = useState<'all' | 'image' | 'video' | 'mixed'>('all');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return TEMPLATE_OPTIONS.filter((template) => {
      const inCategory = activeCategory === 'all' || template.category === activeCategory;
      const inFormat = activeFormat === 'all' || template.format === activeFormat;
      const inQuery =
        q.length === 0 ||
        template.title.toLowerCase().includes(q) ||
        template.description.toLowerCase().includes(q);
      return inCategory && inFormat && inQuery;
    });
  }, [query, activeCategory, activeFormat]);

  return (
    <section className="h-full overflow-hidden rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-sm">
      <div className="sticky top-0 z-10 rounded-t-3xl border-b border-gray-200 bg-white/95 p-6 backdrop-blur">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Creative Hub</p>
            <h2 className="text-2xl font-semibold tracking-tight">Template Library</h2>
          </div>
          <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs text-gray-600">
            {filtered.length} templates
          </span>
        </div>

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates"
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:bg-white"
          />
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setActiveCategory(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                activeCategory === value
                  ? 'border-amber-300 bg-amber-100 text-amber-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {(['all', 'image', 'video', 'mixed'] as const).map((format) => (
            <button
              key={format}
              onClick={() => setActiveFormat(format)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition ${
                activeFormat === format
                  ? 'border-gray-800 bg-gray-900 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
              }`}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((template) => {
          const Icon = CATEGORY_ICONS[template.category] ?? Clapperboard;
          return (
            <article
              key={template.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className={`h-44 w-full bg-gradient-to-br ${template.accentClass} p-4`}>
                <div className="flex items-start justify-between">
                  <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                    {template.format}
                  </span>
                  <Icon size={16} className="text-gray-700/80" />
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{template.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{template.description}</p>
                </div>
                <button
                  onClick={() => onUseTemplate(template)}
                  className="w-full rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Use Template
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
