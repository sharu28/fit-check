'use client';

import { useState } from 'react';
import { Shirt, Save, Loader2, Eraser } from 'lucide-react';
import { ImageUploader } from './ImageUploader';
import { MAX_GARMENTS } from '@/lib/constants';
import type { UploadedImage } from '@/types';

interface GarmentGridProps {
  garments: UploadedImage[];
  onGarmentChange: (image: UploadedImage | null, index: number) => void;
  onSaveUpload?: (image: UploadedImage, saveId: string) => void;
  savingId: string | null;
  onRemoveBg?: (index: number) => void;
  removingBgSlots?: Set<number>;
  onBulkDrop?: (files: File[]) => void;
}

export function GarmentGrid({
  garments,
  onGarmentChange,
  onSaveUpload,
  savingId,
  onRemoveBg,
  removingBgSlots,
  onBulkDrop,
}: GarmentGridProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const hasEmptySlots = garments.length < MAX_GARMENTS;

  const handleDragOver = (e: React.DragEvent) => {
    if (!onBulkDrop || !hasEmptySlots) return;
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (!onBulkDrop) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onBulkDrop(files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
        <div className="flex items-center gap-2">
          <Shirt size={14} /> Garment / Outfit
        </div>
        <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600">
          Mode via template
        </span>
      </div>

      <div
        className="bg-gray-50 p-1 rounded-2xl border border-gray-200 relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
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
                  {/* Removing-BG overlay spinner */}
                  {removingBgSlots?.has(index) && (
                    <div className="absolute inset-0 bg-black/40 rounded-xl flex items-center justify-center z-20">
                      <Loader2 size={20} className="animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 rounded-full backdrop-blur-sm pointer-events-none">
                    #{index + 1}
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-all z-10">
                    {onRemoveBg && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveBg(index);
                        }}
                        disabled={removingBgSlots?.has(index)}
                        className="p-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full disabled:opacity-50"
                        title="Remove Background"
                      >
                        {removingBgSlots?.has(index) ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Eraser size={10} />
                        )}
                      </button>
                    )}
                    {onSaveUpload && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveUpload(garments[index], `garment-${index}`);
                        }}
                        disabled={savingId === `garment-${index}`}
                        className="p-1 bg-black/50 hover:bg-indigo-600 text-white rounded-full disabled:opacity-50"
                        title="Save to Gallery"
                      >
                        {savingId === `garment-${index}` ? (
                          <Loader2 size={10} className="animate-spin" />
                        ) : (
                          <Save size={10} />
                        )}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Bulk drop overlay — only shown when dragging files over and slots are available */}
        {isDraggingOver && hasEmptySlots && (
          <div className="absolute inset-0 rounded-2xl bg-indigo-50/95 border-2 border-dashed border-indigo-400 flex flex-col items-center justify-center gap-2 z-30 pointer-events-none">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <Eraser size={18} className="text-indigo-500" />
            </div>
            <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Drop to auto-remove BG</p>
            <p className="text-[10px] text-indigo-400">{MAX_GARMENTS - garments.length} slot{MAX_GARMENTS - garments.length !== 1 ? 's' : ''} available</p>
          </div>
        )}
      </div>
    </div>
  );
}
