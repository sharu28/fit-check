'use client';

import { Shirt, ChevronDown, Save, Loader2 } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { MAX_GARMENTS } from '@/lib/constants';
import type { UploadedImage, GenerationMode } from '@/types';

interface GarmentGridProps {
  garments: UploadedImage[];
  mode: GenerationMode;
  onModeChange: (mode: GenerationMode) => void;
  onGarmentChange: (image: UploadedImage | null, index: number) => void;
  onSaveUpload?: (image: UploadedImage, saveId: string) => void;
  savingId: string | null;
}

export function GarmentGrid({
  garments,
  mode,
  onModeChange,
  onGarmentChange,
  onSaveUpload,
  savingId,
}: GarmentGridProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
        <div className="flex items-center gap-2">
          <Shirt size={14} /> Garment / Outfit
        </div>
        <div className="relative">
          <select
            value={mode}
            onChange={(e) => onModeChange(e.target.value as GenerationMode)}
            className="appearance-none bg-gray-100 hover:bg-gray-200 pl-3 pr-7 py-1 rounded-md text-xs font-bold text-gray-700 cursor-pointer focus:outline-none focus:ring-1 focus:ring-gray-300"
          >
            <option value="single">Single Swap</option>
            <option value="panel">Grid Panel</option>
          </select>
          <ChevronDown
            size={10}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-1 rounded-2xl border border-gray-200">
        <div className="grid grid-cols-2 gap-1">
          {Array.from({ length: MAX_GARMENTS }, (_, index) => (
            <div key={index} className="aspect-square relative group">
              <ImageUploader
                image={garments[index] || null}
                onImageChange={(img) => onGarmentChange(img, index)}
                minimal
                label={garments[index] ? undefined : `Slot ${index + 1}`}
              />
              {garments[index] && (
                <>
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                    #{index + 1}
                  </div>
                  {onSaveUpload && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveUpload(garments[index], `garment-${index}`);
                      }}
                      disabled={savingId === `garment-${index}`}
                      className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all z-10 disabled:opacity-50"
                      title="Save to Gallery"
                    >
                      {savingId === `garment-${index}` ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Save size={10} />
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
