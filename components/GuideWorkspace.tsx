export function GuideWorkspace() {
  return (
    <section className="h-full overflow-y-auto bg-[#f4f8f5] p-4 md:p-8">
      <div className="mx-auto max-w-5xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Guide</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">How to use Fit Check</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900">1. Pick a template</h2>
            <p className="mt-2 text-sm text-gray-600">Start with Templates to load a ready-made creative workflow.</p>
          </article>
          <article className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900">2. Upload assets</h2>
            <p className="mt-2 text-sm text-gray-600">Add model and garment references, then tune style settings.</p>
          </article>
          <article className="rounded-2xl border border-gray-200 p-4">
            <h2 className="text-base font-semibold text-gray-900">3. Generate and iterate</h2>
            <p className="mt-2 text-sm text-gray-600">Use Assistant for prompt refinement and rapid concept iteration.</p>
          </article>
        </div>
      </div>
    </section>
  );
}
