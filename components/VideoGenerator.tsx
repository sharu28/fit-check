'use client';

import { useRef, useState } from 'react';
import {
  ArrowRight,
  Download,
  ImagePlus,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  UserRound,
  Wand2,
  X,
} from 'lucide-react';
import { getVideoEnvironmentPreset } from '@/lib/video-environment-presets';
import type { VideoStatus, VideoItem } from '@/hooks/useVideoGeneration';
import type { UploadedImage, VideoEnvironmentSelection } from '@/types';

const MAX_PRODUCTS = 4;

const TEMPLATE_PREVIEWS = [
  {
    id: 'rotation-360',
    title: '360 Rotation',
    description: 'Smooth product spin reveal with clean camera path.',
    gradient: 'from-slate-900 via-slate-700 to-slate-500',
  },
  {
    id: 'ugc-reels',
    title: 'UGC / Reels',
    description: 'Social-ready short video with quick lifestyle cuts.',
    gradient: 'from-rose-900 via-amber-700 to-orange-400',
  },
  {
    id: 'launch-campaign',
    title: 'Launch Campaign',
    description: 'Bold hero motion built for product drop announcements.',
    gradient: 'from-indigo-900 via-purple-700 to-violet-400',
  },
];

interface VideoGeneratorProps {
  status: VideoStatus;
  videos: VideoItem[];
  progress: number;
  errorMsg: string | null;
  prompt: string;
  onPromptChange: (p: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onRemoveVideo: (id: string) => void;
  credits: number | null;
  productImages: UploadedImage[];
  subjectImage: UploadedImage | null;
  environment: VideoEnvironmentSelection | null;
  onAddProduct: (slotIndex?: number) => void;
  onChooseProductFromGallery: (slotIndex?: number) => void;
  onRemoveProduct: (slotIndex: number) => void;
  onOpenSubjectPicker: () => void;
  onClearSubject: () => void;
  onOpenEnvironmentPicker: () => void;
  onClearEnvironment: () => void;
}

export function VideoGenerator({
  status,
  videos,
  progress,
  errorMsg,
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
  onRemoveVideo,
  credits,
  productImages,
  subjectImage,
  environment,
  onAddProduct,
  onChooseProductFromGallery,
  onRemoveProduct,
  onOpenSubjectPicker,
  onClearSubject,
  onOpenEnvironmentPicker,
  onClearEnvironment,
}: VideoGeneratorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const noCredits = credits !== null && credits <= 0;
  const hasContent = status === 'generating' || videos.length > 0;
  const showQuickStart = !hasContent;

  const downloadVideo = (url: string) => {
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(url)}`;
    link.download = `fit-check-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const environmentPreset =
    environment?.type === 'preset'
      ? getVideoEnvironmentPreset(environment.presetId)
      : null;

  const renderProductSlots = () => {
    const slots = productImages.map((image, index) => (
      <article
        key={`video-product-${index}`}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="aspect-[4/3] bg-gray-100">
          <img
            src={image.previewUrl}
            alt={`Product slot ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="space-y-2 p-3">
          <p className="text-sm font-semibold text-gray-900">Product {index + 1}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAddProduct(index)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Change
            </button>
            <button
              type="button"
              onClick={() => onChooseProductFromGallery(index)}
              className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              Gallery
            </button>
            <button
              type="button"
              onClick={() => onRemoveProduct(index)}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              Remove
            </button>
          </div>
        </div>
      </article>
    ));

    if (productImages.length < MAX_PRODUCTS) {
      slots.push(
        <button
          key="video-product-add"
          type="button"
          onClick={() => onAddProduct()}
          className="flex aspect-[4/3] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-gray-700 transition hover:border-indigo-400 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm">
            <Plus size={18} />
          </span>
          <span className="text-sm font-semibold">Add Product</span>
          <span className="mt-1 text-xs text-gray-500">Upload product photo</span>
        </button>,
      );
    }

    return slots;
  };

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="flex-1 p-4 pb-24 md:p-8 md:pb-28">
        {status === 'error' && videos.length > 0 && (
          <div className="mb-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">
              {errorMsg || 'Generation failed. Please try again.'}
            </p>
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-800"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {showQuickStart && (
          <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] md:p-6">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Video Quick Start
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                Create a video from product photos
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
                  Step 1 Recommended
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Add product photo(s)
                </span>
                <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Step 2 Describe scene and generate
                </span>
              </div>
            </div>

            {status === 'error' && videos.length === 0 && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMsg || 'Generation failed. Check your prompt and try again.'}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {renderProductSlots()}
            </div>
            {productImages.length >= MAX_PRODUCTS && (
              <p className="mt-2 text-xs font-medium text-gray-500">Max 4 products.</p>
            )}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <article className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Subject (optional)
                  </p>
                  {subjectImage && (
                    <button
                      type="button"
                      onClick={onClearSubject}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {subjectImage ? (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={subjectImage.previewUrl}
                      alt="Selected subject"
                      className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        Subject selected
                      </p>
                      <button
                        type="button"
                        onClick={onOpenSubjectPicker}
                        className="mt-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenSubjectPicker}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <UserRound size={14} />
                    Add Subject (optional)
                  </button>
                )}
              </article>

              <article className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                    Environment (optional)
                  </p>
                  {environment && (
                    <button
                      type="button"
                      onClick={onClearEnvironment}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {environment ? (
                  <div className="mt-3 flex items-center gap-3">
                    {environment.type === 'image' ? (
                      <img
                        src={environment.image.previewUrl}
                        alt="Selected environment"
                        className="h-14 w-14 rounded-xl border border-gray-200 object-cover"
                      />
                    ) : (
                      <div
                        className="h-14 w-14 rounded-xl border border-gray-200"
                        style={{
                          background: environmentPreset
                            ? `linear-gradient(140deg, ${environmentPreset.gradient[0]} 0%, ${environmentPreset.gradient[1]} 55%, ${environmentPreset.gradient[2]} 100%)`
                            : 'linear-gradient(140deg, #dbeafe 0%, #cbd5e1 100%)',
                        }}
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {environment.type === 'preset'
                          ? environmentPreset?.label ?? 'Preset selected'
                          : 'Custom environment'}
                      </p>
                      <button
                        type="button"
                        onClick={onOpenEnvironmentPicker}
                        className="mt-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={onOpenEnvironmentPicker}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <ImagePlus size={14} />
                    Choose Environment (optional)
                  </button>
                )}
              </article>
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                Suggested Templates
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATE_PREVIEWS.map((template) => (
                  <article
                    key={template.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                  >
                    <div className={`h-20 bg-gradient-to-br ${template.gradient}`} />
                    <div className="space-y-1 p-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {template.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-gray-600">
                        {template.description}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {hasContent && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {status === 'generating' && (
              <div className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-600 bg-gray-900">
                <div className="relative mb-4 h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
                  <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
                  <Wand2
                    className="absolute inset-0 m-auto animate-pulse text-indigo-400"
                    size={20}
                  />
                </div>
                <p className="animate-pulse text-sm font-semibold text-gray-300">
                  Generating...
                </p>
                {progress > 0 && (
                  <div className="mt-3 w-24">
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-700">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-center text-xs text-gray-500">
                      {Math.round(progress * 100)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {videos.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                isPlaying={playingId === item.id}
                onPlay={() => setPlayingId(playingId === item.id ? null : item.id)}
                onDownload={() => downloadVideo(item.url)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-xs overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-500">
                <Trash2 size={24} />
              </div>
              <h3 className="mb-1 font-semibold text-gray-900">Delete video?</h3>
              <p className="text-sm text-gray-500">
                This will remove this video from your history.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onRemoveVideo(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 border-l border-gray-100 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {(status === 'idle' || status === 'error' || status === 'success') && (
        <div className="absolute bottom-10 left-1/2 z-30 w-full max-w-2xl -translate-x-1/2 px-4">
          <p className="mb-2 text-center text-xs font-medium text-gray-500">
            Tip: adding product photos improves results. Subject and environment are optional.
          </p>
          <div className="flex items-end gap-3 rounded-[2rem] border border-gray-200 bg-white p-2 pl-4 shadow-2xl ring-gray-100 transition-all focus-within:ring-4">
            <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Sparkles size={14} />
            </div>

            <textarea
              ref={textareaRef}
              className="max-h-[120px] flex-1 resize-none overflow-hidden bg-transparent py-2.5 text-sm font-medium text-gray-800 outline-none placeholder:text-gray-400"
              placeholder="Describe the video scene..."
              value={prompt}
              rows={1}
              onChange={(event) => {
                onPromptChange(event.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  onGenerate();
                }
              }}
            />

            <div className="mx-1 mb-2 h-6 w-px bg-gray-200" />

            <div className="flex items-center gap-1 pr-1 pb-0.5">
              <button
                onClick={onGenerate}
                disabled={noCredits}
                title={noCredits ? 'No credits remaining' : undefined}
                className={`flex h-9 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition-all ${
                  noCredits
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'bg-black text-white hover:scale-105 hover:bg-gray-800 hover:shadow-lg active:scale-95'
                }`}
              >
                <span>Generate</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  item,
  isPlaying,
  onPlay,
  onDownload,
  onDelete,
}: {
  item: VideoItem;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-video overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
      {isPlaying ? (
        <>
          <video
            src={item.url}
            controls
            autoPlay
            loop
            className="h-full w-full object-contain"
          />
          <button
            onClick={onPlay}
            className="absolute right-2 top-2 z-10 rounded-full bg-black/70 p-1.5 text-white transition-colors hover:bg-black/90"
            title="Close"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onPlay}
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm transition-colors group-hover:bg-white/30">
              <Play size={20} className="ml-0.5 text-white" />
            </span>
          </button>
          <div className="pointer-events-none absolute inset-0 flex items-end justify-center gap-2 bg-black/40 pb-3 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(event) => {
                event.stopPropagation();
                onPlay();
              }}
              className="pointer-events-auto rounded-full bg-white p-2 text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
              title="Play"
            >
              <Play size={16} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDownload();
              }}
              className="pointer-events-auto rounded-full bg-white p-2 text-gray-900 shadow-sm transition-colors hover:bg-gray-50"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              className="pointer-events-auto rounded-full bg-white p-2 text-red-500 shadow-sm transition-colors hover:bg-red-50"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
