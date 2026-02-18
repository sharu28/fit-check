'use client';

import { useRef } from 'react';
import { X, Upload, CheckCircle } from 'lucide-react';
import { PRESET_MODELS } from '@/lib/constants';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import type { UploadedImage, GalleryItem } from '@/types';

interface SubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage: (image: UploadedImage) => void;
  galleryUploads: GalleryItem[];
  onGallerySelect: (item: GalleryItem) => void;
}

export function SubjectModal({
  isOpen,
  onClose,
  onSelectImage,
  galleryUploads,
  onGallerySelect,
}: SubjectModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const loadUrlAsImage = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const file = new File([blob], 'preset_subject.jpg', { type: blob.type });
      const base64 = await fileToBase64(file);
      const previewUrl = await readFileToDataUrl(file);

      onSelectImage({ file, previewUrl, base64, mimeType: blob.type });
      onClose();
    } catch (e) {
      console.error('Failed to load image', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const previewUrl = await readFileToDataUrl(file);
      const base64 = await fileToBase64(file);
      onSelectImage({ file, previewUrl, base64, mimeType: file.type });
      onClose();
    } catch (err) {
      console.error('Error processing file:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Choose a Model</h2>
            <p className="text-sm text-gray-500 mt-1">
              Select a preset, upload your own, or choose from your gallery.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 custom-scrollbar">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
            Presets & Upload
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
            {/* Upload Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload
                  size={20}
                  className="text-gray-400 group-hover:text-indigo-600"
                />
              </div>
              <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-700">
                Upload New
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>

            {/* Preset Cards */}
            {PRESET_MODELS.map((model, idx) => (
              <div
                key={idx}
                onClick={() => loadUrlAsImage(model.url)}
                className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <img
                  src={model.url}
                  alt={model.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <span className="text-white text-xs font-medium">
                    {model.label}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Gallery Section */}
          {galleryUploads.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                My Gallery{' '}
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {galleryUploads.length}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {galleryUploads.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onGallerySelect(item)}
                    className="relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer group border border-gray-100 hover:ring-2 ring-black transition-all"
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt="Gallery Upload"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <CheckCircle
                        className="text-white drop-shadow-md"
                        size={24}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
