'use client';

import { useRef, useState } from 'react';
import { Images } from 'lucide-react';

export default function StyleStudioToolbarPreviewPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Change Garment
            </button>
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Change Subject
            </button>
            <input ref={inputRef} type="file" accept="image/*" className="sr-only" />
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50">
              Templates
            </button>
            <button
              onClick={() => setShowLibrary((prev) => !prev)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
                showLibrary
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Images size={16} />
              Gallery
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
