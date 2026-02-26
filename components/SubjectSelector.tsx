'use client';

import { RefreshCw, User, Save, Loader2 } from 'lucide-react';
import type { UploadedImage } from '@/types';

interface SubjectSelectorProps {
  personImage: UploadedImage | null;
  onOpenModal: () => void;
  onSaveUpload?: (image: UploadedImage, saveId: string) => void;
  savingId: string | null;
}

export function SubjectSelector({
  personImage,
  onOpenModal,
  onSaveUpload,
  savingId,
}: SubjectSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
          <User size={14} /> Subject Reference (Optional)
        </div>
        {personImage && onSaveUpload && (
          <button
            onClick={() => onSaveUpload(personImage, 'person')}
            disabled={savingId === 'person'}
            className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-md transition-colors text-xs font-medium disabled:opacity-50"
            title="Save to Gallery"
          >
            {savingId === 'person' ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Save size={12} />
            )}
            {savingId === 'person' ? 'Saving...' : 'Save'}
          </button>
        )}
      </div>

      <div
        onClick={onOpenModal}
        className={`relative w-full aspect-square rounded-2xl border-2 overflow-hidden cursor-pointer group transition-all ${
          personImage
            ? 'border-gray-200'
            : 'border-dashed border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300'
        }`}
      >
        {personImage ? (
          <>
            <img
              src={personImage.previewUrl}
              alt="Subject"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/90 text-gray-900 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm flex items-center gap-1.5">
                <RefreshCw size={12} /> Change Model
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
              <User size={20} className="text-gray-400" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wide">
              Select Model
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
