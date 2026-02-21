const ACADEMY_ITEMS = [
  { title: 'Fit Check Basics', type: 'Course', description: 'End-to-end walkthrough from templates to export.' },
  { title: 'Demo: Product Shoot in 10 Minutes', type: 'Video', description: 'Quick production flow for ecommerce launches.' },
  { title: 'AI Foundations for Creators', type: 'Course', description: 'Core AI concepts explained for non-technical teams.' },
];

export function AcademyWorkspace() {
  return (
    <section className="h-full overflow-y-auto bg-[#f4f8f5] p-4 md:p-8">
      <div className="mx-auto max-w-6xl rounded-3xl border border-emerald-100 bg-white p-6 shadow-sm md:p-8">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">Academy</p>
        <h1 className="mt-2 text-3xl font-semibold text-gray-900">Courses and Demo Videos</h1>
        <p className="mt-2 text-sm text-gray-600">Learn the app workflow and build AI literacy with guided lessons.</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {ACADEMY_ITEMS.map((item) => (
            <article key={item.title} className="rounded-2xl border border-gray-200 p-4">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">{item.type}</span>
              <h2 className="mt-3 text-base font-semibold text-gray-900">{item.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
              <button
                type="button"
                className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Open
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
