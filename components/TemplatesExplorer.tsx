'use client';

import { useMemo, useState, useEffect } from 'react';
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
  Shirt,
} from 'lucide-react';
import type { GenerationMode } from '@/types';

export interface TemplateOption {
  id: string;
  title: string;
  category: string;
  format: 'image' | 'video' | 'mixed';
  description: string;
  defaultPrompt: string;
  presetPrompts?: string[];
  targetTool: 'style-studio' | 'video-generator' | 'bg-remover';
  generationMode?: GenerationMode;
  accentClass: string;
}

const TEMPLATE_PROMPT_PRESETS: Record<string, string[]> = {
  'single-swap': [
    'Replace the subject outfit with the provided garment. Keep face, pose, and body proportions unchanged. Preserve garment texture, stitching, and print details in a realistic full-body fashion photo.',
    'Apply the uploaded clothing item to the subject naturally, matching lighting and shadows. Keep identity and anatomy consistent, with clean ecommerce-ready framing.',
    'Dress the model in the provided garment with photoreal accuracy. Maintain original background context, sharp fabric detail, and natural drape across the body.',
  ],
  'multi-shot': [
    'Create a 2x2 fashion panel using the provided garments. Show distinct styling variations in each quadrant while keeping the same model identity and consistent studio lighting.',
    'Generate a multi-look contact sheet: four outfits, one model, clear separation per frame. Preserve garment details and balanced composition for comparison.',
    'Produce a clean 2x2 try-on board with four coordinated looks from the garment set. Keep pose and facial realism strong and each panel visually legible.',
  ],
  'website-shoot': [
    'Create a polished ecommerce hero image with premium studio lighting, centered composition, and accurate garment detail for homepage use.',
    'Generate a high-conversion storefront visual: crisp subject focus, clean background separation, and premium catalog styling.',
    'Produce a website-ready fashion shot with balanced contrast, natural skin tones, and sharp product texture suitable for brand landing pages.',
  ],
  'social-campaign': [
    'Create a social campaign key visual with bold framing, modern color energy, and scroll-stopping composition optimized for feeds and stories.',
    'Generate platform-native campaign creative that feels trendy and premium, with expressive styling and strong subject focus.',
    'Design an Instagram-first campaign frame with high visual punch, fashion-forward direction, and clear product storytelling.',
  ],
  'product-ads': [
    'Design a performance ad visual emphasizing product fit, texture, and silhouette with conversion-focused composition and clean brand presentation.',
    'Generate a paid-social ready fashion ad frame with clear CTA space, strong product readability, and premium lighting.',
    'Create a high-intent ad creative that highlights garment detail and value, optimized for click-through and catalog consistency.',
  ],
  'launch-campaign-video': [
    'Create a cinematic launch video for a new fashion drop with bold reveals, confident camera motion, and premium brand energy.',
    'Generate a product launch reel with dramatic pacing, hero close-ups, and social-ready moments that announce a new collection.',
    'Produce a high-impact announcement video with dynamic transitions, fashion storytelling, and conversion-focused final frames.',
  ],
  'remove-background-batch': [
    'Remove image backgrounds cleanly while preserving fine garment edges, transparency in hair strands, and natural contours.',
    'Create transparent cutouts with precise edge detection for apparel images, minimizing halos and retaining fabric detail.',
    'Batch-remove backgrounds for product photos with crisp silhouettes and export-ready transparent outputs.',
  ],
  'rotation-360': [
    'Generate a smooth 360-degree product showcase video with consistent speed, stable framing, and clean studio lighting.',
    'Create a full-angle rotation clip that highlights garment construction and texture from front, side, and back views.',
    'Produce a premium turntable-style fashion rotation with minimal jitter and clear detail visibility throughout.',
  ],
  'lookbook-editorial': [
    'Create an editorial lookbook frame with high-fashion styling, dramatic but clean lighting, and premium magazine-grade composition.',
    'Generate a runway-inspired lookbook visual with art-direction polish, strong silhouette emphasis, and luxury tone.',
    'Design a seasonal editorial shot with intentional mood, elevated styling, and refined color grading.',
  ],
  'ugc-reels': [
    'Generate a UGC-style fashion reel with natural movement, creator-friendly framing, and authentic social pacing.',
    'Create a handheld-style short video that feels real and relatable while clearly showcasing fit, texture, and movement.',
    'Produce a TikTok-ready outfit reel with engaging cuts, natural expressions, and product-first storytelling.',
  ],
  'seasonal-drop': [
    'Create a seasonal campaign visual for a new collection drop with festive mood, cohesive styling, and launch-ready polish.',
    'Generate a limited-time drop creative with strong atmosphere, timely color direction, and clear product storytelling.',
    'Design a holiday/seasonal fashion launch frame with premium art direction and social-commerce readiness.',
  ],
  'marketplace-listings': [
    'Create a marketplace-compliant product image with neutral background, accurate garment colors, and clear front-facing visibility.',
    'Generate a clean listing photo optimized for catalog standards: minimal distractions, true-to-life texture, and consistent framing.',
    'Produce a conversion-ready marketplace image with precise product representation and platform-friendly composition.',
  ],
};

export const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'single-swap',
    title: 'Single Swap',
    category: 'tryon',
    format: 'image',
    description: 'Try one garment on a model in a clean single-look output.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['single-swap'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['single-swap'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-sky-200 via-blue-200 to-indigo-200',
  },
  {
    id: 'multi-shot',
    title: 'Multi Shot',
    category: 'tryon',
    format: 'image',
    description: 'Generate a 2x2 set showing multiple outfit looks in one output.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['multi-shot'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['multi-shot'],
    targetTool: 'style-studio',
    generationMode: 'panel',
    accentClass: 'from-violet-200 via-fuchsia-200 to-pink-200',
  },
  {
    id: 'website-shoot',
    title: 'Website Shoot',
    category: 'website',
    format: 'image',
    description: 'Crisp storefront-ready model shots with clean composition.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['website-shoot'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['website-shoot'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-slate-200 via-slate-300 to-zinc-200',
  },
  {
    id: 'social-campaign',
    title: 'Social Media Campaign',
    category: 'social',
    format: 'mixed',
    description: 'Platform-first visuals tailored for feeds, reels, and stories.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['social-campaign'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['social-campaign'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-indigo-300 via-fuchsia-300 to-rose-300',
  },
  {
    id: 'product-ads',
    title: 'Product Ads',
    category: 'ads',
    format: 'mixed',
    description: 'Conversion-focused ad-ready frames with premium product emphasis.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['product-ads'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['product-ads'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-amber-200 via-orange-200 to-red-200',
  },
  {
    id: 'launch-campaign-video',
    title: 'Launch Campaign Video',
    category: 'social',
    format: 'video',
    description: 'Create high-impact launch videos for product drops and brand announcements.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['launch-campaign-video'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['launch-campaign-video'],
    targetTool: 'video-generator',
    accentClass: 'from-rose-200 via-orange-200 to-amber-200',
  },
  {
    id: 'remove-background-batch',
    title: 'Remove Background',
    category: 'background',
    format: 'image',
    description: 'Drop multiple photos and get transparent PNG cutouts in one batch.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['remove-background-batch'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['remove-background-batch'],
    targetTool: 'bg-remover',
    accentClass: 'from-cyan-200 via-blue-200 to-slate-200',
  },
  {
    id: 'rotation-360',
    title: '360 Rotation',
    category: 'rotation',
    format: 'video',
    description: 'Show garments from every angle with smooth rotational camera movement.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['rotation-360'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['rotation-360'],
    targetTool: 'video-generator',
    accentClass: 'from-emerald-200 via-teal-200 to-cyan-200',
  },
  {
    id: 'lookbook-editorial',
    title: 'Lookbook Editorial',
    category: 'lookbook',
    format: 'image',
    description: 'High-fashion editorial layouts for seasonal collections.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['lookbook-editorial'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['lookbook-editorial'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-violet-200 via-fuchsia-200 to-pink-200',
  },
  {
    id: 'ugc-reels',
    title: 'UGC / Reels',
    category: 'social',
    format: 'video',
    description: 'Authentic creator-style clips built for engagement and retention.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['ugc-reels'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['ugc-reels'],
    targetTool: 'video-generator',
    accentClass: 'from-blue-200 via-indigo-200 to-purple-200',
  },
  {
    id: 'seasonal-drop',
    title: 'Seasonal Drops',
    category: 'seasonal',
    format: 'mixed',
    description: 'Holiday and campaign-ready concepts for launch windows.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['seasonal-drop'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['seasonal-drop'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-rose-200 via-red-200 to-amber-200',
  },
  {
    id: 'marketplace-listings',
    title: 'Marketplace Listings',
    category: 'marketplace',
    format: 'image',
    description: 'Clean listing-compliant assets for marketplaces and catalogs.',
    defaultPrompt: TEMPLATE_PROMPT_PRESETS['marketplace-listings'][0],
    presetPrompts: TEMPLATE_PROMPT_PRESETS['marketplace-listings'],
    targetTool: 'style-studio',
    generationMode: 'single',
    accentClass: 'from-zinc-200 via-stone-200 to-neutral-300',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  tryon: 'Try-On Modes',
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
  tryon: Shirt,
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
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [previewErrors, setPreviewErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/admin/template-previews');
        if (!res.ok) return;
        const { previews: map } = (await res.json()) as { previews: Record<string, string> };
        setPreviews(map);
      } catch {
        // silently fail — fallback to gradients
      }
    })();
  }, []);

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
    <section className="h-full overflow-y-auto rounded-3xl border border-gray-200 bg-white text-gray-900 shadow-sm custom-scrollbar">
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
          const previewUrl = previewErrors[template.id] ? undefined : previews[template.id];
          const isVideoPreview = previewUrl?.endsWith('.mp4');

          return (
            <article
              key={template.id}
              className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className={`relative h-44 w-full overflow-hidden bg-gradient-to-br ${template.accentClass}`}>
                {previewUrl && !isVideoPreview && (
                  <img
                    src={previewUrl}
                    alt={`${template.title} preview`}
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => setPreviewErrors((prev) => ({ ...prev, [template.id]: true }))}
                  />
                )}
                {previewUrl && isVideoPreview && (
                  <video
                    src={previewUrl}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={() => setPreviewErrors((prev) => ({ ...prev, [template.id]: true }))}
                  />
                )}
                <div className="relative z-10 flex items-start justify-between p-4">
                  <span className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-700 backdrop-blur-sm">
                    {template.format}
                  </span>
                  <Icon size={16} className={previewUrl ? 'text-white drop-shadow' : 'text-gray-700/80'} />
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
                <p className="mt-2 text-center text-xs text-gray-400">
                  Loads a prompt — then add your photos in the studio to generate.
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
