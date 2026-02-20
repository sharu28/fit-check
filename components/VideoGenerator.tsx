'use client';

import { useRef, useState } from 'react';
import {
  Video,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Play,
  Trash2,
  X,
  Wand2,
} from 'lucide-react';
import type { VideoStatus, VideoItem } from '@/hooks/useVideoGeneration';

interface VideoGeneratorProps {
  status: VideoStatus;
  videos: VideoItem[];
  progress: number;
  errorMsg: string | null;
  prompt: string;
  onPromptChange: (p: string) => void;
  onGenerate: () => void;
  onReset: () => void;
  onRemoveVideo: (id: string) => void;
  credits: number | null;
}

export function VideoGenerator({
  status,
  videos,
  progress,
  errorMsg,
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
  onRemoveVideo,
  credits,
}: VideoGeneratorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const noCredits = credits !== null && credits <= 0;

  const downloadVideo = (url: string) => {
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(url)}`;
    link.download = `fit-check-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hasContent = status === 'generating' || videos.length > 0;

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 p-8 pb-24">
        {/* Error banner when there are existing videos */}
        {status === 'error' && videos.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
            <p className="text-sm text-red-700">
              {errorMsg || 'Generation failed. Please try again.'}
            </p>
            <button
              onClick={onReset}
              className="text-sm font-medium text-red-600 hover:text-red-800 flex items-center gap-1"
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!hasContent && status !== 'error' && (
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <Video size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-600">
              Create a Video
            </h3>
            <p className="text-sm text-gray-400 max-w-xs text-center mt-2">
              Describe a scene and optionally add a reference image. AI will
              generate a short video.
            </p>
          </div>
        )}

        {/* Error state with no existing videos */}
        {status === 'error' && videos.length === 0 && (
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center border-2 border-red-100 bg-red-50/50 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <RefreshCw size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              Generation Failed
            </h3>
            <p className="text-sm text-gray-600 mt-2 mb-6">
              {errorMsg || 'Something went wrong. Please try again.'}
            </p>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Video grid */}
        {hasContent && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Generating card */}
            {status === 'generating' && (
              <div className="aspect-video rounded-xl bg-gray-900 border-2 border-dashed border-gray-600 flex flex-col items-center justify-center">
                <div className="relative w-14 h-14 mb-4">
                  <div className="absolute inset-0 border-4 border-indigo-900 rounded-full" />
                  <div className="absolute inset-0 border-4 border-indigo-400 rounded-full border-t-transparent animate-spin" />
                  <Wand2
                    className="absolute inset-0 m-auto text-indigo-400 animate-pulse"
                    size={20}
                  />
                </div>
                <p className="text-sm font-semibold text-gray-300 animate-pulse">
                  Generating...
                </p>
                {progress > 0 && (
                  <div className="mt-3 w-24">
                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-1">
                      {Math.round(progress * 100)}%
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Video cards */}
            {videos.map((item) => (
              <VideoCard
                key={item.id}
                item={item}
                isPlaying={playingId === item.id}
                onPlay={() => setPlayingId(playingId === item.id ? null : item.id)}
                onDownload={() => downloadVideo(item.url)}
                onDelete={() => setDeleteId(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Delete video?</h3>
              <p className="text-sm text-gray-500">
                This will remove this video from your history.
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
                  onRemoveVideo(deleteId);
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

      {/* Floating Prompt Bar */}
      {(status === 'idle' || status === 'error' || status === 'success') && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
          <div className="bg-white p-2 pl-4 rounded-[2rem] shadow-2xl flex items-end gap-3 border border-gray-200 transition-all focus-within:ring-4 ring-gray-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 mb-1">
              <Sparkles size={14} />
            </div>

            <textarea
              ref={textareaRef}
              className="flex-1 outline-none text-sm font-medium placeholder-gray-400 text-gray-800 bg-transparent resize-none overflow-hidden py-2.5 max-h-[120px]"
              placeholder="Describe the video scene..."
              value={prompt}
              rows={1}
              onChange={(e) => {
                onPromptChange(e.target.value);
                if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onGenerate();
                }
              }}
            />

            <div className="h-6 w-px bg-gray-200 mx-1 mb-2" />

            <div className="flex items-center gap-1 pr-1 pb-0.5">
              <button
                onClick={onGenerate}
                disabled={noCredits}
                title={noCredits ? 'No credits remaining' : undefined}
                className={`h-9 px-6 rounded-full flex items-center justify-center gap-2 transition-all font-semibold text-sm ${
                  noCredits
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 active:scale-95'
                }`}
              >
                <span>Generate</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VideoCard({
  item,
  isPlaying,
  onPlay,
  onDownload,
  onDelete,
}: {
  item: VideoItem;
  isPlaying: boolean;
  onPlay: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-700">
      {isPlaying ? (
        <>
          <video
            src={item.url}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
          <button
            onClick={onPlay}
            className="absolute top-2 right-2 p-1.5 bg-black/70 text-white rounded-full hover:bg-black/90 transition-colors z-10"
            title="Close"
          >
            <X size={14} />
          </button>
        </>
      ) : (
        <>
          <div
            onClick={onPlay}
            className="w-full h-full flex items-center justify-center cursor-pointer bg-gradient-to-br from-gray-800 to-gray-900"
          >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-white/30 transition-colors">
              <Play size={20} className="text-white ml-0.5" />
            </div>
          </div>
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-2 pb-3 pointer-events-none">
            <button
              onClick={(e) => { e.stopPropagation(); onPlay(); }}
              className="pointer-events-auto p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
              title="Play"
            >
              <Play size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="pointer-events-auto p-2 bg-white text-gray-900 rounded-full hover:bg-gray-50 transition-colors shadow-sm"
              title="Download"
            >
              <Download size={16} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="pointer-events-auto p-2 bg-white text-red-500 rounded-full hover:bg-red-50 transition-colors shadow-sm"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
