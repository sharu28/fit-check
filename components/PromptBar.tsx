'use client';

import { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Minus, Plus } from 'lucide-react';
import { AppStatus } from '@/types';

const HINTS = [
  'Try "casual street style, golden hour"',
  'Try "tucked in, slim fit, editorial pose"',
  'Try "walking on the beach at sunset"',
  'Try "studio photoshoot, clean background"',
  'Try "layered outfit, autumn park setting"',
  'Try "formal event, elegant lighting"',
];

interface PromptBarProps {
  prompt: string;
  onPromptChange: (v: string) => void;
  onGenerate: () => void;
  status: AppStatus;
  generationCount: number;
  maxGenerations: number;
  onGenerationCountChange: (next: number) => void;
}

export function PromptBar({
  prompt,
  onPromptChange,
  onGenerate,
  status,
  generationCount,
  maxGenerations,
  onGenerationCountChange,
}: PromptBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [prompt]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setHintIndex((prev) => (prev + 1) % HINTS.length);
        setAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const isGenerating = status === AppStatus.GENERATING;
  const showHint = !prompt;
  const canDecrease = generationCount > 1 && !isGenerating;
  const canIncrease = generationCount < maxGenerations && !isGenerating;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-30">
      <div className="bg-white p-2 pl-4 rounded-[2rem] shadow-2xl flex items-end gap-3 border border-gray-200 transition-all focus-within:ring-4 ring-gray-100">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 mb-1">
          <Sparkles size={14} />
        </div>

        <div className="relative flex-1 py-2.5">
          {showHint && (
            <div className="absolute inset-0 flex items-center overflow-hidden pointer-events-none">
              <span
                className={`text-sm font-medium text-gray-400 transition-all duration-300 ease-in-out ${
                  animating
                    ? 'opacity-0 -translate-y-4'
                    : 'opacity-100 translate-y-0'
                }`}
              >
                {HINTS[hintIndex]}
              </span>
            </div>
          )}
          <textarea
            ref={textareaRef}
            className="w-full outline-none text-sm font-medium text-gray-800 bg-transparent resize-none overflow-hidden max-h-[120px]"
            value={prompt}
            rows={1}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onGenerate();
              }
            }}
          />
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1 mb-2" />

        <div className="flex items-center gap-2 pr-1 pb-0.5">
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-1 py-1">
            <button
              type="button"
              onClick={() => onGenerationCountChange(generationCount - 1)}
              disabled={!canDecrease}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Decrease number of generations"
            >
              <Minus size={14} />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-gray-700 tabular-nums">
              {generationCount}
            </span>
            <button
              type="button"
              onClick={() => onGenerationCountChange(generationCount + 1)}
              disabled={!canIncrease}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Increase number of generations"
            >
              <Plus size={14} />
            </button>
          </div>

          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={`h-9 px-6 rounded-full flex items-center justify-center gap-2 transition-all font-semibold text-sm ${
              isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-black text-white hover:bg-gray-800 hover:shadow-lg hover:scale-105 active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin" />
                <span>Creating...</span>
              </>
            ) : (
              <>
                <span>Generate</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
