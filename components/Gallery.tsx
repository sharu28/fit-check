'use client';

import { useState, useRef } from 'react';
import type { GalleryItem } from '@/types';
import {
  Trash2,
  Download,
  User,
  Shirt,
  Clock,
  Upload,
  Check,
  Play,
} from 'lucide-react';

interface GalleryProps {
  uploads: GalleryItem[];
  generations: GalleryItem[];
  videos?: GalleryItem[];
  onSelectUpload: (item: GalleryItem, target: 'person' | 'garment') => void;
  onDelete: (id: string, type: 'upload' | 'generation') => void;
  onDeleteVideo?: (id: string) => void;
  onUpload?: (file: File) => void;
  selectionMode?: 'try-on' | 'single';
}

export function Gallery({
  uploads,
  generations,
  videos = [],
  onSelectUpload,
  onDelete,
  onDeleteVideo,
  onUpload,
  selectionMode = 'try-on',
}: GalleryProps) {
  const [activeTab, setActiveTab] = useState<'uploads' | 'designs' | 'videos'>(
    'uploads',
  );
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; type: 'upload' | 'generation' | 'video' } | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onUpload) {
      Array.from(files).forEach((file) => onUpload(file));
    }
    if (e.target) e.target.value = '';
  };

  const EmptyState = ({ message }: { message: string }) => (
    <div className="w-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
      <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
        <Clock size={20} />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Your Gallery</h2>
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('uploads')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'uploads'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Uploads ({uploads.length})
          </button>
          <button
            onClick={() => setActiveTab('designs')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              activeTab === 'designs'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            My Designs ({generations.length})
          </button>
          {videos.length > 0 && (
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === 'videos'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              My Videos ({videos.length})
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'uploads' && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="aspect-[3/4] rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/50 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <Upload
                  size={18}
                  className="text-gray-400 group-hover:text-indigo-600"
                />
              </div>
              <span className="text-xs font-bold text-gray-600 group-hover:text-indigo-700">
                Upload New
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {uploads.map((item) => (
              <div
                key={item.id}
                className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
              >
                <img
                  src={item.thumbnailUrl || item.url}
                  alt="Upload"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                  {selectionMode === 'single' ? (
                    <>
                      <p className="text-white text-xs font-medium mb-1">
                        Select Image:
                      </p>
                      <button
                        onClick={() => onSelectUpload(item, 'person')}
                        className="w-full py-2 px-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors font-semibold"
                      >
                        <Check size={14} /> Select
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-white text-xs font-medium mb-1">
                        Use as:
                      </p>
                      <button
                        onClick={() => onSelectUpload(item, 'person')}
                        className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
                      >
                        <User size={12} /> Person
                      </button>
                      <button
                        onClick={() => onSelectUpload(item, 'garment')}
                        className="w-full py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs rounded-md flex items-center justify-center gap-1.5 backdrop-blur-sm transition-colors"
                      >
                        <Shirt size={12} /> Garment
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setDeleteTarget({ id: item.id, type: 'upload' })}
                    className="absolute top-2 right-2 p-1.5 text-white/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'designs' && (
          <>
            {generations.length === 0 ? (
              <EmptyState message="No designs generated yet" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {generations.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                  >
                    <img
                      src={item.thumbnailUrl || item.url}
                      alt="Generated Design"
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <a
                        href={`/api/download?url=${encodeURIComponent(item.url)}`}
                        className="p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors"
                        title="Download High Res"
                      >
                        <Download size={18} />
                      </a>
                      <button
                        onClick={() => setDeleteTarget({ id: item.id, type: 'generation' })}
                        className="p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'videos' && (
          <>
            {videos.length === 0 ? (
              <EmptyState message="No videos generated yet" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videos.map((item) => (
                  <div
                    key={item.id}
                    className="group relative aspect-video rounded-lg overflow-hidden bg-gray-900 border border-gray-700"
                  >
                    {playingVideoId === item.id ? (
                      <video
                        src={item.url}
                        controls
                        autoPlay
                        loop
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div
                        onClick={() => setPlayingVideoId(item.id)}
                        className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900"
                      >
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
                          <Play size={20} className="text-white ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 pb-3 pointer-events-none">
                      <a
                        href={`/api/download?url=${encodeURIComponent(item.url)}`}
                        className="pointer-events-auto p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
                        title="Download"
                      >
                        <Download size={16} />
                      </a>
                      <button
                        onClick={() => setDeleteTarget({ id: item.id, type: 'video' })}
                        className="pointer-events-auto p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Delete {deleteTarget.type === 'upload' ? 'upload' : deleteTarget.type === 'video' ? 'video' : 'design'}?
              </h3>
              <p className="text-sm text-gray-500">
                This will permanently remove this {deleteTarget.type === 'video' ? 'video' : 'image'}.
              </p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteTarget.type === 'video') {
                    onDeleteVideo?.(deleteTarget.id);
                  } else {
                    onDelete(deleteTarget.id, deleteTarget.type);
                  }
                  setDeleteTarget(null);
                }}
                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
