'use client';

import { ImageUploader } from './ImageUploader';
import {
  Volume2,
  VolumeX,
  Square,
  RectangleHorizontal,
  RectangleVertical,
} from 'lucide-react';
import type { UploadedImage } from '@/types';

function getRatioIcon(r: string) {
  switch (r) {
    case '1:1':
      return <Square size={12} />;
    case '16:9':
      return <RectangleHorizontal size={14} />;
    default:
      return <RectangleVertical size={14} />;
  }
}

interface VideoControlsProps {
  referenceImage: UploadedImage | null;
  onReferenceImageChange: (img: UploadedImage | null) => void;
  aspectRatio: string;
  onAspectRatioChange: (r: string) => void;
  duration: 5 | 10;
  onDurationChange: (d: 5 | 10) => void;
  sound: boolean;
  onSoundChange: (s: boolean) => void;
}

const ASPECT_RATIOS = ['1:1', '16:9', '9:16'];

export function VideoControls({
  referenceImage,
  onReferenceImageChange,
  aspectRatio,
  onAspectRatioChange,
  duration,
  onDurationChange,
  sound,
  onSoundChange,
}: VideoControlsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase">
          Reference Image (optional)
        </label>
        <ImageUploader
          image={referenceImage}
          onImageChange={onReferenceImageChange}
        />
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase">
          Aspect Ratio
        </label>
        <div className="flex gap-2">
          {ASPECT_RATIOS.map((r) => (
            <button
              key={r}
              onClick={() => onAspectRatioChange(r)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                aspectRatio === r
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {getRatioIcon(r)} {r}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase">
          Duration
        </label>
        <div className="flex gap-2">
          {([5, 10] as const).map((d) => (
            <button
              key={d}
              onClick={() => onDurationChange(d)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all border ${
                duration === d
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs font-bold tracking-wider text-gray-500 uppercase">
          Sound
        </label>
        <button
          onClick={() => onSoundChange(!sound)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all border ${
            sound
              ? 'bg-black text-white border-black'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
          }`}
        >
          {sound ? <Volume2 size={14} /> : <VolumeX size={14} />}
          {sound ? 'Sound On' : 'Sound Off'}
        </button>
      </div>
    </div>
  );
}
