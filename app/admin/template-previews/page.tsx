'use client';

import { useState, useEffect, useCallback } from 'react';
import { TEMPLATE_OPTIONS } from '@/components/TemplatesExplorer';
import type { TemplateOption } from '@/components/TemplatesExplorer';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, Play } from 'lucide-react';

type PreviewStatus = 'idle' | 'generating' | 'polling' | 'saving' | 'done' | 'error';

interface TemplateState {
  status: PreviewStatus;
  previewUrl?: string;
  error?: string;
  taskId?: string;
  taskType?: 'image' | 'video';
  isBgSource?: boolean;
  progress?: number;
}

export default function TemplatePreviewsAdmin() {
  const [states, setStates] = useState<Record<string, TemplateState>>(() =>
    Object.fromEntries(TEMPLATE_OPTIONS.map((t) => [t.id, { status: 'idle' }])),
  );

  // Load existing previews on mount
  useEffect(() => {
    void (async () => {
      const res = await fetch('/api/admin/template-previews');
      if (!res.ok) return;
      const { previews } = (await res.json()) as { previews: Record<string, string> };
      setStates((prev) => {
        const next = { ...prev };
        for (const [id, url] of Object.entries(previews)) {
          if (next[id]) next[id] = { status: 'done', previewUrl: url };
        }
        return next;
      });
    })();
  }, []);

  const updateState = useCallback((id: string, patch: Partial<TemplateState>) => {
    setStates((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }, []);

  const pollTask = useCallback(
    async (templateId: string, taskId: string, taskType: 'image' | 'video', isBgSource?: boolean) => {
      updateState(templateId, { status: 'polling', taskId, taskType });

      const maxAttempts = taskType === 'video' ? 120 : 80;
      const intervalMs = taskType === 'video' ? 5000 : 3000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        await new Promise((r) => setTimeout(r, intervalMs));

        const res = await fetch(`/api/generate/status?taskId=${taskId}`);
        if (!res.ok) continue;

        const data = (await res.json()) as {
          status: 'processing' | 'completed' | 'failed';
          progress?: number;
          resultUrls?: string[];
          error?: string;
        };

        updateState(templateId, { progress: data.progress });

        if (data.status === 'failed') {
          updateState(templateId, { status: 'error', error: data.error ?? 'Generation failed' });
          return;
        }

        if (data.status === 'completed' && data.resultUrls?.[0]) {
          // Save to R2
          updateState(templateId, { status: 'saving' });
          const saveRes = await fetch('/api/admin/template-previews/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              templateId,
              resultUrl: data.resultUrls[0],
              type: taskType,
              isBgSource,
            }),
          });

          if (!saveRes.ok) {
            const err = (await saveRes.json()) as { error?: string };
            updateState(templateId, { status: 'error', error: err.error ?? 'Save failed' });
            return;
          }

          const saved = (await saveRes.json()) as {
            previewUrl?: string;
            videoTaskId?: string;
          };

          if (saved.videoTaskId) {
            // bg-remover bonus video: poll for it too
            await pollTask(templateId, saved.videoTaskId, 'video', false);
            return;
          }

          updateState(templateId, {
            status: 'done',
            previewUrl: saved.previewUrl,
          });
          return;
        }
      }

      updateState(templateId, { status: 'error', error: 'Timed out waiting for generation' });
    },
    [updateState],
  );

  const handleGenerate = useCallback(
    async (template: TemplateOption) => {
      updateState(template.id, { status: 'generating', error: undefined });

      const res = await fetch('/api/admin/template-previews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId: template.id }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        updateState(template.id, { status: 'error', error: err.error ?? 'Failed to start generation' });
        return;
      }

      const { taskId, type, step } = (await res.json()) as {
        taskId: string;
        type: 'image' | 'video';
        step?: string;
      };

      void pollTask(template.id, taskId, type, step === 'bg-source');
    },
    [updateState, pollTask],
  );

  const handleGenerateAll = useCallback(() => {
    for (const template of TEMPLATE_OPTIONS) {
      const s = states[template.id];
      if (s?.status !== 'done' && s?.status !== 'generating' && s?.status !== 'polling') {
        void handleGenerate(template);
      }
    }
  }, [states, handleGenerate]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Template Previews</h1>
            <p className="mt-1 text-sm text-gray-500">
              Generate AI preview images/videos for each template. Stored in R2 at{' '}
              <code className="rounded bg-gray-100 px-1 text-xs">template-previews/&#123;id&#125;.jpg|mp4</code>
            </p>
          </div>
          <button
            onClick={handleGenerateAll}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
          >
            Generate All Missing
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_OPTIONS.map((template) => {
            const state = states[template.id] ?? { status: 'idle' };
            const isActive = state.status === 'generating' || state.status === 'polling' || state.status === 'saving';
            const isVideo = template.format === 'video' || (template.id === 'remove-background-batch' && state.previewUrl?.endsWith('.mp4'));

            return (
              <div
                key={template.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {/* Preview area */}
                <div className={`relative h-40 w-full bg-gradient-to-br ${template.accentClass}`}>
                  {state.previewUrl && !isVideo && (
                    <img
                      src={state.previewUrl}
                      alt={template.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {state.previewUrl && isVideo && (
                    <video
                      src={state.previewUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  )}
                  {isActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white">
                      <Loader2 size={24} className="animate-spin" />
                      <p className="mt-2 text-xs font-semibold capitalize">
                        {state.status}
                        {state.progress ? ` ${state.progress}%` : ''}
                      </p>
                    </div>
                  )}
                  {state.status === 'done' && (
                    <div className="absolute right-2 top-2 rounded-full bg-emerald-500 p-1 text-white shadow">
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{template.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{template.format} · {template.category}</p>
                    </div>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                      {template.id === 'remove-background-batch' ? 'pixian+kling' : template.format === 'video' ? 'kling/sora' : 'seedream-5'}
                    </span>
                  </div>

                  {state.error && (
                    <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-red-50 p-2 text-xs text-red-700">
                      <AlertCircle size={13} className="mt-0.5 shrink-0" />
                      <span>{state.error}</span>
                    </div>
                  )}

                  <button
                    onClick={() => void handleGenerate(template)}
                    disabled={isActive}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {state.status === 'done' ? (
                      <>
                        <RefreshCw size={13} />
                        Regenerate
                      </>
                    ) : isActive ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        {state.status}…
                      </>
                    ) : (
                      <>
                        <Play size={13} />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
