'use client';

import { useState } from 'react';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  text: string;
}

const SEED_MESSAGES: Message[] = [
  {
    id: 'm1',
    role: 'assistant',
    text: 'Welcome to Fit Check Assistant. Ask for campaign ideas, prompt rewrites, or workflow help.',
  },
  {
    id: 'm2',
    role: 'user',
    text: 'Give me 3 prompt angles for a premium streetwear drop.',
  },
  {
    id: 'm3',
    role: 'assistant',
    text: 'Try: 1) cinematic dusk rooftop, 2) clean concrete studio with hard side light, 3) fast-cut downtown editorial with motion blur accents.',
  },
];

export function AssistantWorkspace() {
  const [messages] = useState<Message[]>(SEED_MESSAGES);

  return (
    <section className="h-full bg-[#f5f6f8] p-4 md:p-6">
      <div className="mx-auto flex h-full max-w-5xl flex-col rounded-3xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-200 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Assistant</p>
          <h2 className="text-xl font-semibold text-gray-900">Fit Check Assistant</h2>
          <p className="mt-1 text-sm text-gray-600">Chat-style workspace for prompt strategy and creative planning.</p>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {messages.map((message) => (
            <article
              key={message.id}
              className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                message.role === 'assistant'
                  ? 'mr-auto bg-gray-100 text-gray-800'
                  : 'ml-auto bg-gray-900 text-white'
              }`}
            >
              {message.text}
            </article>
          ))}
        </div>

        <footer className="border-t border-gray-200 px-5 py-4">
          <label htmlFor="assistant-input" className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Message
          </label>
          <div className="flex items-center gap-2">
            <input
              id="assistant-input"
              type="text"
              placeholder="Ask the assistant..."
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-600"
            />
            <button
              type="button"
              className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </section>
  );
}
