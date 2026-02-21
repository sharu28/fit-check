'use client';

const QUICK_CARDS = [
  'Place product in a new setting',
  'Generate different angles of a person',
  'Optimize text for SEO',
];

const TOKENS = {
  canvas:
    'bg-[radial-gradient(circle_at_top,#e7f5ee_0%,#f8fafc_42%,#f8fafc_100%)]',
  textPrimary: 'text-gray-900',
  textMuted: 'text-gray-500',
  panel: 'bg-white border border-gray-200',
  panelShadow: 'shadow-[0_18px_40px_rgba(15,23,42,0.08)]',
  composerDivider: 'border-gray-200',
  chip: 'border border-amber-200 bg-amber-50 text-amber-700',
  sendButton: 'bg-gray-900 text-white hover:bg-black',
  banner:
    'border border-gray-200 bg-gradient-to-r from-sky-200 via-indigo-200 to-fuchsia-200',
  quickCard: 'border border-gray-200 bg-white',
};

export function AssistantWorkspace() {
  return (
    <section className={`h-full overflow-y-auto p-4 md:p-8 ${TOKENS.canvas}`}>
      <div className="mx-auto w-full max-w-5xl">
        <p className={`text-sm ${TOKENS.textMuted}`}>History</p>

        <div className="mt-20 text-center md:mt-24">
          <h1 className={`text-3xl font-medium leading-tight md:text-5xl ${TOKENS.textPrimary}`}>
            Good morning,
            <br />
            What do you want to create?
          </h1>

          <div
            className={`mx-auto mt-10 w-full max-w-3xl rounded-3xl p-4 md:p-5 ${TOKENS.panel} ${TOKENS.panelShadow}`}
          >
            <label htmlFor="assistant-input" className="sr-only">Ask assistant</label>
            <textarea
              id="assistant-input"
              rows={3}
              placeholder="Describe your idea, product, or campaign goal..."
              className="w-full resize-none bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
            />
            <div className={`mt-3 flex items-center justify-between gap-3 border-t pt-3 text-sm ${TOKENS.composerDivider}`}>
              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${TOKENS.chip}`}
              >
                Templates
              </button>
              <button
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 ${TOKENS.sendButton}`}
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 w-full max-w-3xl space-y-4">
          <article className={`overflow-hidden rounded-2xl ${TOKENS.banner}`}>
            <div className="p-5">
              <p className="text-2xl font-semibold text-gray-900">Explore templates</p>
              <button
                type="button"
                className="mt-4 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
              >
                Explore
              </button>
            </div>
          </article>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {QUICK_CARDS.map((title) => (
              <article key={title} className={`rounded-2xl p-4 ${TOKENS.quickCard}`}>
                <p className="text-sm font-semibold text-gray-800">{title}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
