'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { Download, ImagePlus, Loader2, Trash2, Wand2 } from 'lucide-react';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';

interface BatchItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  inputPreviewUrl: string;
  inputBase64: string;
  status: 'queued' | 'processing' | 'done' | 'error';
  outputPreviewUrl?: string;
  outputBase64?: string;
  error?: string;
}

const TOKENS = {
  surface: '#f4f8f5',
  panel: '#ffffff',
  border: '#d5e5d8',
  borderStrong: '#87b796',
  textPrimary: '#173122',
  textMuted: '#516a5d',
  accent: '#2f7b46',
  accentStrong: '#1f5f34',
  focus: '#14532d',
  shadow: '0 12px 28px rgba(23, 49, 34, 0.08)',
  radius: '16px',
  radiusLarge: '20px',
  spaceSm: '10px',
  spaceMd: '16px',
  spaceLg: '24px',
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const CONCURRENCY = 3;

function formatFileSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB`;
}

export function BulkBackgroundRemover() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stats = useMemo(() => {
    const queued = items.filter((item) => item.status === 'queued').length;
    const processing = items.filter((item) => item.status === 'processing').length;
    const done = items.filter((item) => item.status === 'done').length;
    const failed = items.filter((item) => item.status === 'error').length;
    return { queued, processing, done, failed };
  }, [items]);

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const valid = list.filter((file) => file.type.startsWith('image/') && file.size <= MAX_FILE_SIZE_BYTES);
    if (valid.length === 0) return;

    const next = await Promise.all(
      valid.map(async (file) => {
        const [inputPreviewUrl, inputBase64] = await Promise.all([
          readFileToDataUrl(file),
          fileToBase64(file),
        ]);
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          mimeType: file.type,
          inputPreviewUrl,
          inputBase64,
          status: 'queued',
        } as BatchItem;
      }),
    );

    setItems((prev) => [...next, ...prev]);
  }, []);

  const processItem = useCallback(async (item: BatchItem) => {
    const id = item.id;
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'processing', error: undefined } : item)),
    );

    try {
      const res = await fetch('/api/generate/remove-bg', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: item.inputBase64,
          mimeType: item.mimeType,
          saveToGallery: false,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Background removal failed');
      }

      const data = await res.json();
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'done',
                outputPreviewUrl: data.previewUrl,
                outputBase64: data.base64,
              }
            : entry,
        ),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Background removal failed';
      setItems((prev) =>
        prev.map((entry) =>
          entry.id === id
            ? {
                ...entry,
                status: 'error',
                error: message,
              }
            : entry,
        ),
      );
    }
  }, []);

  const processAll = useCallback(async () => {
    const queuedItems = items.filter((item) => item.status === 'queued' || item.status === 'error');
    if (queuedItems.length === 0 || isProcessing) return;

    setIsProcessing(true);
    try {
      let cursor = 0;
      const workers = Array.from({ length: Math.min(CONCURRENCY, queuedItems.length) }, async () => {
        while (cursor < queuedItems.length) {
          const current = queuedItems[cursor];
          cursor += 1;
          await processItem(current);
        }
      });
      await Promise.all(workers);
    } finally {
      setIsProcessing(false);
    }
  }, [items, isProcessing, processItem]);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const resetQueue = useCallback(() => {
    setItems([]);
  }, []);

  const retryFailed = useCallback(() => {
    setItems((prev) =>
      prev.map((item) => (item.status === 'error' ? { ...item, status: 'queued', error: undefined } : item)),
    );
  }, []);

  const downloadItem = useCallback((item: BatchItem) => {
    if (!item.outputBase64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${item.outputBase64}`;
    link.download = `${item.name.replace(/\.[^.]+$/, '')}-no-bg.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const downloadAll = useCallback(() => {
    items.filter((item) => item.status === 'done').forEach(downloadItem);
  }, [items, downloadItem]);

  return (
    <section
      className="h-full overflow-y-auto p-4 md:p-8"
      style={{
        background: TOKENS.surface,
        color: TOKENS.textPrimary,
      }}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6" style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <header
          className="rounded-[20px] border p-5 md:p-7"
          style={{
            background: TOKENS.panel,
            borderColor: TOKENS.border,
            boxShadow: TOKENS.shadow,
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em]" style={{ color: TOKENS.textMuted }}>
            Batch Studio
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold md:text-3xl">Bulk Background Removal</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadAll}
                disabled={stats.done === 0}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                style={{ borderColor: TOKENS.border, color: TOKENS.textPrimary }}
              >
                <Download size={16} />
                Download All
              </button>
              <button
                onClick={processAll}
                disabled={(stats.queued === 0 && stats.failed === 0) || isProcessing}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                style={{ background: TOKENS.accent }}
              >
                {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
                Process All
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: TOKENS.border }}>
              <span style={{ color: TOKENS.textMuted }}>Queued</span>
              <p className="text-lg font-semibold">{stats.queued}</p>
            </div>
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: TOKENS.border }}>
              <span style={{ color: TOKENS.textMuted }}>Processing</span>
              <p className="text-lg font-semibold">{stats.processing}</p>
            </div>
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: TOKENS.border }}>
              <span style={{ color: TOKENS.textMuted }}>Done</span>
              <p className="text-lg font-semibold">{stats.done}</p>
            </div>
            <div className="rounded-xl border px-3 py-2" style={{ borderColor: TOKENS.border }}>
              <span style={{ color: TOKENS.textMuted }}>Failed</span>
              <p className="text-lg font-semibold">{stats.failed}</p>
            </div>
          </div>
        </header>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDropActive(true);
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDropActive(false);
            void addFiles(e.dataTransfer.files);
          }}
          className="rounded-[20px] border-2 border-dashed p-7 text-center"
          style={{
            background: TOKENS.panel,
            borderColor: dropActive ? TOKENS.borderStrong : TOKENS.border,
          }}
        >
          <ImagePlus className="mx-auto" size={28} style={{ color: TOKENS.accentStrong }} />
          <h3 className="mt-3 text-lg font-semibold">Drop images here in bulk</h3>
          <p className="mt-1 text-sm" style={{ color: TOKENS.textMuted }}>
            JPG, PNG, WEBP up to 10MB each. Backgrounds are removed via Pixian API.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`mt-4 inline-flex rounded-xl border px-4 py-2 text-sm font-semibold ${focusRing}`}
            style={{ borderColor: TOKENS.border, color: TOKENS.textPrimary }}
          >
            Choose Files
          </button>
          <input
            ref={fileInputRef}
            id="bulk-bg-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files) void addFiles(e.target.files);
            }}
            className="sr-only"
          />
        </div>

        <section
          className="rounded-[20px] border p-4 md:p-6"
          style={{
            background: TOKENS.panel,
            borderColor: TOKENS.border,
            boxShadow: TOKENS.shadow,
          }}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Queue</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={retryFailed}
                disabled={stats.failed === 0 || isProcessing}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                style={{ borderColor: TOKENS.border, color: TOKENS.textPrimary }}
              >
                Retry Failed
              </button>
              <button
                onClick={resetQueue}
                disabled={items.length === 0 || isProcessing}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                style={{ borderColor: TOKENS.border, color: TOKENS.textPrimary }}
              >
                Clear All
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="rounded-xl border p-5 text-sm" style={{ borderColor: TOKENS.border, color: TOKENS.textMuted }}>
              No files yet. Drop multiple images to build a batch.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {items.map((item) => (
                <article key={item.id} className="rounded-xl border p-3" style={{ borderColor: TOKENS.border }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase" style={{ color: TOKENS.textMuted }}>
                        Before
                      </p>
                      <img
                        src={item.inputPreviewUrl}
                        alt={`${item.name} original`}
                        className="h-40 w-full rounded-lg object-cover"
                      />
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase" style={{ color: TOKENS.textMuted }}>
                        After
                      </p>
                      <div className="flex h-40 w-full items-center justify-center rounded-lg border bg-white" style={{ borderColor: TOKENS.border }}>
                        {item.status === 'processing' ? (
                          <Loader2 size={20} className="animate-spin" style={{ color: TOKENS.accentStrong }} />
                        ) : item.status === 'done' && item.outputPreviewUrl ? (
                          <img
                            src={item.outputPreviewUrl}
                            alt={`${item.name} background removed`}
                            className="h-full w-full rounded-lg object-cover"
                          />
                        ) : (
                          <span className="px-2 text-xs text-center" style={{ color: TOKENS.textMuted }}>
                            {item.status === 'error' ? item.error : 'Waiting to process'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs" style={{ color: TOKENS.textMuted }}>
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase"
                      style={{
                        background:
                          item.status === 'done'
                            ? '#dcfce7'
                            : item.status === 'error'
                            ? '#fee2e2'
                            : item.status === 'processing'
                            ? '#dbeafe'
                            : '#f1f5f9',
                        color:
                          item.status === 'done'
                            ? '#166534'
                            : item.status === 'error'
                            ? '#991b1b'
                            : item.status === 'processing'
                            ? '#1d4ed8'
                            : '#475569',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => downloadItem(item)}
                      disabled={item.status !== 'done'}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                      style={{ borderColor: TOKENS.border }}
                    >
                      <Download size={14} /> Download
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      disabled={isProcessing}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                      style={{ borderColor: TOKENS.border }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
  const focusRing =
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#14532d]';
