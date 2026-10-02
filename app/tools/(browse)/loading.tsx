export default function Loading() {
  return (
    <main id="main" className="container py-12" aria-busy="true">
      <span className="sr-only" role="status">Loading tools…</span>
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-3 h-9 w-56" />
      <div className="skeleton mt-8 h-11 w-full" />
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="card p-5">
            <div className="flex items-center gap-3.5">
              <div className="skeleton h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3" />
                <div className="skeleton h-3 w-1/3" />
              </div>
              <div className="skeleton h-11 w-11 rounded-full" />
            </div>
            <div className="skeleton mt-5 h-3 w-full" />
            <div className="skeleton mt-2 h-3 w-4/5" />
            <div className="skeleton mt-6 h-8 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}
