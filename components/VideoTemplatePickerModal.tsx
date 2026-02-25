'use client';

import { ArrowRight, Clapperboard, X } from 'lucide-react';
import type { TemplateOption } from '@/components/TemplatesExplorer';

interface VideoTemplatePickerModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  templates: TemplateOption[];
  onClose: () => void;
  onSelect: (template: TemplateOption) => void;
}

export function VideoTemplatePickerModal({
  isOpen,
  imageUrl,
  templates,
  onClose,
  onSelect,
}: VideoTemplatePickerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose video template"
    >
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] md:h-[calc(100vh-3rem)]">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Create Video
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 md:text-2xl">
              Choose a video template
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We will use your selected image as the reference frame.
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
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <aside className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Selected image
              </p>
              <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Selected image preview"
                    className="aspect-[4/5] w-full object-cover"
                  />
                ) : (
                  <div className="aspect-[4/5] w-full bg-gray-100" />
                )}
              </div>
            </aside>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {templates.map((template) => (
                <article
                  key={template.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                >
                  <div className="relative h-28 overflow-hidden">
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${template.accentClass}`}
                    />
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-700">
                      Video Template
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600">
                        {template.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelect(template)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <Clapperboard size={14} />
                      Use Template
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
