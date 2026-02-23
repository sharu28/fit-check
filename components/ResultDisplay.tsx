'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  Download,
  RefreshCw,
  Wand2,
  Share2,
  Copy,
  X,
  Check,
  Smartphone,
  Link2,
  Trash2,
  Eraser,
  Loader2,
} from 'lucide-react';
import { AppStatus } from '@/types';
import type { GalleryItem } from '@/types';

interface ResultDisplayProps {
  status: AppStatus;
  resultImage: string | null;
  generations: GalleryItem[];
  pendingCount?: number;
  progress?: number;
  onReset: () => void;
  onDelete: (id: string) => void;
  onRemoveBg?: (imageUrl: string, galleryId?: string) => void;
  removingBgId?: string | null;
  emptyState?: ReactNode;
}

export function ResultDisplay({
  status,
  resultImage,
  generations,
  pendingCount = 1,
  progress = 0,
  onReset,
  onDelete,
  onRemoveBg,
  removingBgId,
  emptyState,
}: ResultDisplayProps) {
  const [shareImage, setShareImage] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>(
    'idle',
  );

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(url)}`;
    link.download = `fit-check-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleNativeShare = async (url: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const file = new File([blob], 'fit-check.png', { type: blob.type });

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'My Fit Check',
          text: 'Check out this look I generated with Fit Check!',
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleCopyImage = async (url: string) => {
    if (typeof ClipboardItem === 'undefined') {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }

    try {
      const res = await fetch(url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const handleCopyLink = async (url: string) => {
    if (url.startsWith('data:')) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  // Check if resultImage is already in gallery (to avoid duplicate)
  const unsavedResult =
    status === AppStatus.SUCCESS &&
    resultImage &&
    !generations.some((g) => g.url === resultImage);

  const hasContent =
    status === AppStatus.GENERATING ||
    unsavedResult ||
    generations.length > 0;

  // Empty state — no generations and not generating
  if (!hasContent && status !== AppStatus.ERROR) {
    if (emptyState) return <>{emptyState}</>;
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
          <Wand2 size={32} />
        </div>
        <h3 className="text-lg font-medium text-gray-600">Ready to Create</h3>
        <p className="text-sm text-gray-400 max-w-xs text-center mt-2">
          Upload a person and a clothing item, then click generate to see the
          magic happen.
        </p>
      </div>
    );
  }

  // Error state with no existing generations
  if (status === AppStatus.ERROR && generations.length === 0 && !unsavedResult) {
    return (
      <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-red-100 bg-red-50/50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
          <RefreshCw size={32} />
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          Generation Failed
        </h3>
        <p className="text-sm text-gray-600 mt-2 mb-6">
          Something went wrong. Please try again.
        </p>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Error banner when there are existing generations */}
      {status === AppStatus.ERROR && generations.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <p className="text-sm text-red-700">
            Generation failed. Please try again.
          </p>
          <button
            onClick={onReset}
            className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {/* Generating cards */}
        {status === AppStatus.GENERATING &&
          Array.from({ length: Math.max(1, pendingCount) }).map((_, index) => (
            <div
              key={`loading-${index}`}
              className="relative aspect-[3/4] overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-white via-indigo-50/70 to-sky-100/70 p-4"
            >
              <div
                className="absolute inset-0 animate-pulse bg-gradient-to-tr from-transparent via-white/50 to-transparent"
                style={{ animationDelay: `${index * 120}ms` }}
              />
              <div className="relative flex h-full items-center justify-center">
                <div className="relative h-16 w-16">
                  <div className="absolute inset-0 rounded-full border-2 border-indigo-200/80" />
                  <div className="absolute inset-0 animate-[spin_2.2s_linear_infinite] rounded-full border-2 border-transparent border-r-indigo-500 border-t-indigo-600" />
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/10 to-sky-500/20 animate-pulse" />
                  <Wand2 className="absolute inset-0 m-auto text-indigo-600/90" size={18} />
                </div>
              </div>
              <div className="absolute bottom-3 left-4 right-4 h-1.5 overflow-hidden rounded-full bg-indigo-100/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-500"
                  style={{ width: `${Math.max(8, Math.round(progress * 100))}%` }}
                />
              </div>
            </div>
          ))}

        {/* Unsaved latest result (before auto-save completes) */}
        {unsavedResult && resultImage && (
          <ImageCard
            url={resultImage}
            isNew
            onDownload={() => downloadImage(resultImage)}
            onShare={() => setShareImage(resultImage)}
          />
        )}

        {/* All saved generations */}
        {generations.map((item) => (
          <ImageCard
            key={item.id}
            url={item.url}
            fullUrl={item.url}
            onDownload={() => downloadImage(item.url)}
            onShare={() => setShareImage(item.url)}
            onDelete={() => setDeleteId(item.id)}
            onRemoveBg={onRemoveBg ? () => onRemoveBg(item.url, item.id) : undefined}
            isRemovingBg={removingBgId === item.id}
          />
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Delete design?</h3>
              <p className="text-sm text-gray-500">
                This will permanently remove this image from your gallery.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Share your creation
              </h3>
              <button
                onClick={() => setShareImage(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-3">
              <div className="aspect-[3/4] w-32 mx-auto rounded-lg overflow-hidden bg-gray-100 mb-4 shadow-inner border border-gray-200">
                <img
                  src={shareImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {typeof navigator !== 'undefined' &&
                typeof navigator.canShare === 'function' && (
                  <button
                    onClick={() => handleNativeShare(shareImage)}
                    className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Smartphone size={18} />
                    Share via App
                  </button>
                )}

              {!shareImage.startsWith('data:') && (
                <button
                  onClick={() => handleCopyLink(shareImage)}
                  className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"
                >
                  <Link2 size={18} />
                  Copy Link
                </button>
              )}

              <button
                onClick={() => handleCopyImage(shareImage)}
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"
              >
                {copyStatus === 'copied' ? (
                  <Check size={18} className="text-green-600" />
                ) : (
                  <Copy size={18} />
                )}
                {copyStatus === 'copied'
                  ? 'Copied!'
                  : copyStatus === 'error'
                    ? 'Copy not supported'
                    : 'Copy Image'}
              </button>

              <button
                onClick={() => downloadImage(shareImage)}
                className="w-full py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors border border-gray-200"
              >
                <Download size={18} />
                Download Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ImageCard({
  url,
  fullUrl,
  isNew,
  onDownload,
  onShare,
  onDelete,
  onRemoveBg,
  isRemovingBg,
}: {
  url: string;
  fullUrl?: string;
  isNew?: boolean;
  onDownload: () => void;
  onShare: () => void;
  onDelete?: () => void;
  onRemoveBg?: () => void;
  isRemovingBg?: boolean;
}) {
  return (
    <div
      className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border ${
        isNew ? 'border-indigo-300 ring-2 ring-indigo-200' : 'border-gray-200'
      }`}
    >
      <img
        src={url}
        alt="Generated Design"
        className="w-full h-full object-cover"
        loading="lazy"
      />
      {isRemovingBg && (
        <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
          <Loader2 className="animate-spin text-indigo-600" size={24} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <button
          onClick={onShare}
          className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          title="Share"
        >
          <Share2 size={18} />
        </button>
        <button
          onClick={onDownload}
          className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
          title="Download"
        >
          <Download size={18} />
        </button>
        {onRemoveBg && (
          <button
            onClick={onRemoveBg}
            disabled={isRemovingBg}
            className="p-2 bg-white text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-50"
            title="Remove Background"
          >
            <Eraser size={18} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm"
            title="Delete"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
      {isNew && (
        <div className="absolute top-2 left-2 px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold rounded-full">
          New
        </div>
      )}
    </div>
  );
}
