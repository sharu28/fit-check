'use client';

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { UploadedImage } from '@/types';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from '@/lib/constants';

interface ImageUploaderProps {
  label?: string;
  image: UploadedImage | null;
  onImageChange: (image: UploadedImage | null) => void;
  onError?: (message: string) => void;
  minimal?: boolean;
}

export function ImageUploader({
  label,
  image,
  onImageChange,
  onError,
  minimal = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onError?.('Please upload an image file.');
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError?.(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is ${MAX_FILE_SIZE_MB}MB.`,
      );
      return;
    }

    try {
      const previewUrl = await readFileToDataUrl(file);
      const base64 = await fileToBase64(file);
      onImageChange({ file, previewUrl, base64, mimeType: file.type });
    } catch (err) {
      console.error('Error processing file:', err);
      onError?.('Failed to process the image.');
    }
  };

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold tracking-wider text-gray-500 mb-2 uppercase">
          {label}
        </label>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative w-full aspect-square rounded-xl border-2 border-dashed transition-all duration-200 overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : ''}
          ${
            image
              ? 'border-gray-200 bg-white'
              : 'border-gray-200 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-400'
          }`}
      >
        {image ? (
          <div className="relative w-full h-full group">
            <img
              src={image.previewUrl}
              alt={label}
              className="w-full h-full object-cover"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onImageChange(null);
              }}
              className="absolute top-2 right-2 p-1.5 bg-white/90 text-gray-700 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all transform hover:scale-105 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center w-full h-full cursor-pointer group"
          >
            <div
              className={`w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-3 transition-transform ${isDragging ? 'scale-110' : 'group-hover:scale-110'}`}
            >
              <Plus
                size={20}
                className="text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </div>
            <span className="text-xs font-bold text-gray-400 group-hover:text-gray-600 tracking-wide">
              {isDragging ? 'DROP HERE' : 'ADD IMAGE'}
            </span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
