'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Upload, CheckCircle, Search, Loader2 } from 'lucide-react';
import { fileToBase64, readFileToDataUrl } from '@/lib/utils';
import type { UploadedImage, GalleryItem, ModelPreset } from '@/types';

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
  const [presets, setPresets] = useState<ModelPreset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    const fetchPresets = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set('q', query.trim());
        if (selectedCategory !== 'all') params.set('category', selectedCategory);
        params.set('limit', '120');

        const res = await fetch(`/api/model-presets?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload.error || 'Failed to load model presets');
        }
        const payload = await res.json();
        setPresets(payload.presets || []);
        setCategories(payload.categories || []);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          return;
        }
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load model presets');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPresets, 180);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isOpen, query, selectedCategory]);

  const loadPresetAsImage = async (preset: ModelPreset) => {
    try {
      const response = await fetch(preset.imageUrl);
      const blob = await response.blob();
      const mimeType = blob.type || preset.mimeType || 'image/jpeg';
      const extension = mimeType.includes('png') ? 'png' : 'jpg';
      const file = new File([blob], `preset_subject.${extension}`, { type: mimeType });
      const base64 = await fileToBase64(file);
      const previewUrl = await readFileToDataUrl(file);

      onSelectImage({ file, previewUrl, base64, mimeType });
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

  const totalPresetCount = useMemo(() => presets.length, [presets]);

  if (!isOpen) return null;

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

          <div className="mb-4 grid md:grid-cols-[1fr_auto] gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by keyword (e.g. indian, woman, dress)"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-10 rounded-xl border border-gray-200 px-3 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Subject presets aren&apos;t available right now — use{' '}
              <strong>Upload New</strong> below to add your own photo.
            </div>
          )}

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
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-12 text-gray-500">
                <Loader2 size={18} className="animate-spin mr-2" />
                Loading presets...
              </div>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => loadPresetAsImage(preset)}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden group cursor-pointer border border-gray-200 shadow-sm hover:shadow-md transition-all"
                >
                  <img
                    src={preset.thumbnailUrl || preset.imageUrl}
                    alt={preset.label}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 gap-1">
                    <span className="text-white text-xs font-semibold">
                      {preset.label}
                    </span>
                    {preset.tags.length > 0 && (
                      <span className="text-white/90 text-[11px]">
                        {preset.tags.slice(0, 3).join(', ')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}

            {!loading && totalPresetCount === 0 && (
              <div className="col-span-full rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                No presets found for this search.
              </div>
            )}
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
