'use client';

import { useRef } from 'react';
import {
  Video,
  Download,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { VideoStatus } from '@/hooks/useVideoGeneration';

interface VideoGeneratorProps {
  status: VideoStatus;
  videoUrl: string | null;
  progress: number;
  errorMsg: string | null;
  prompt: string;
  onPromptChange: (p: string) => void;
  onGenerate: () => void;
  onReset: () => void;
}

export function VideoGenerator({
  status,
  videoUrl,
  progress,
  errorMsg,
  prompt,
  onPromptChange,
  onGenerate,
  onReset,
}: VideoGeneratorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const downloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement('a');
    link.href = `/api/download?url=${encodeURIComponent(videoUrl)}`;
    link.download = `fit-check-video-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col relative">
      <div className="flex-1 p-8 pb-24">
        {status === 'idle' && (
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

        {status === 'generating' && (
          <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 rounded-2xl">
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin" />
              <Video
                className="absolute inset-0 m-auto text-indigo-600 animate-pulse"
                size={24}
              />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 animate-pulse">
              Generating Video...
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              This may take a minute or two
            </p>
            {progress > 0 && (
              <div className="mt-4 w-48">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round(progress * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 text-center mt-1">
                  {Math.round(progress * 100)}%
                </p>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
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

        {status === 'success' && videoUrl && (
          <div className="w-full h-full flex flex-col">
            <div className="relative w-full flex-grow bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
              <video
                src={videoUrl}
                controls
                autoPlay
                loop
                className="w-full h-full object-contain"
              />
            </div>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={downloadVideo}
                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-all shadow-sm font-medium"
              >
                <Download size={18} /> Download
              </button>
              <button
                onClick={onReset}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all shadow-sm font-medium"
              >
                <RefreshCw size={18} /> Create Another
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Prompt Bar */}
      {(status === 'idle' || status === 'error') && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
          <div className="bg-white p-2 pl-4 rounded-[2rem] shadow-2xl flex items-end gap-3 border border-gray-200 transition-all focus-within:ring-4 ring-gray-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 mb-1">
              <Sparkles size={14} />
            </div>

            <textarea
              ref={textareaRef}
              className="flex-1 outline-none text-sm font-medium placeholder-gray-400 text-gray-800 bg-transparent resize-none overflow-hidden py-2.5 max-h-[120px]"
              placeholder="Describe the video scene (e.g., 'A model walking down a runway in a flowing dress')..."
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
                className="h-9 px-6 rounded-full flex items-center justify-center gap-2 transition-all font-semibold text-sm bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 active:scale-95"
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
