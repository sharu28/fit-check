'use client';

import { useRef, type ChangeEvent } from 'react';
import { ImagePlus, Upload, X } from 'lucide-react';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import { VIDEO_ENVIRONMENT_PRESETS } from '@/lib/video-environment-presets';
import type { UploadedImage, VideoEnvironmentSelection } from '@/types';

interface EnvironmentPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: VideoEnvironmentSelection) => void;
}

function GradientPreview({ colors }: { colors: [string, string, string] }) {
  return (
    <div
      className="h-full w-full"
      style={{
        background: `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 55%, ${colors[2]} 100%)`,
      }}
    />
  );
}

export function EnvironmentPickerModal({
  isOpen,
  onClose,
  onSelect,
}: EnvironmentPickerModalProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      event.currentTarget.value = '';
      return;
    }

    const [previewUrl, base64] = await Promise.all([
      readFileToDataUrl(file),
      fileToBase64(file),
    ]);
    const uploadedImage: UploadedImage = {
      file,
      previewUrl,
      base64,
      mimeType: file.type,
    };
    onSelect({ type: 'image', image: uploadedImage });
    event.currentTarget.value = '';
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm md:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choose environment"
    >
      <div className="mx-auto flex h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] md:h-[calc(100vh-3rem)]">
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 md:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
              Optional Input
            </p>
            <h2 className="mt-1 text-xl font-semibold text-gray-900 md:text-2xl">
              Choose environment
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Pick a preset scene style or upload your own environment image.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <X size={14} />
            Close
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 custom-scrollbar md:px-8 md:py-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {VIDEO_ENVIRONMENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelect({ type: 'preset', presetId: preset.id })}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <div className="h-24">
                  <GradientPreview colors={preset.gradient} />
                </div>
                <div className="space-y-1 p-3">
                  <p className="text-sm font-semibold text-gray-900">{preset.label}</p>
                  <p className="text-xs text-gray-600">{preset.description}</p>
                </div>
              </button>
            ))}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex min-h-[156px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 text-center transition hover:border-indigo-400 hover:bg-indigo-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-500 shadow-sm">
                <ImagePlus size={18} />
              </div>
              <p className="text-sm font-semibold text-gray-800">Upload your own</p>
              <p className="mt-1 text-xs text-gray-500">Use a custom scene image</p>
              <span className="mt-3 inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                <Upload size={11} />
                Upload
              </span>
            </button>
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void handleUpload(event);
        }}
      />
    </div>
  );
}
