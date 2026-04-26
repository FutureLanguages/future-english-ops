export default function AdminLoading() {
  return (
    <div className="grid min-h-screen bg-mist/35 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <aside className="border-b border-black/10 bg-white/90 p-5 lg:col-start-2 lg:row-start-1 lg:h-screen lg:border-b-0 lg:border-l">
        <div className="h-10 w-40 animate-pulse rounded-full bg-sand" />
        <div className="mt-8 space-y-3">
          <div className="h-10 animate-pulse rounded-xl bg-sand" />
          <div className="h-10 animate-pulse rounded-xl bg-sand" />
          <div className="h-10 animate-pulse rounded-xl bg-sand" />
          <div className="h-10 animate-pulse rounded-xl bg-sand" />
        </div>
      </aside>
      <main className="min-w-0 px-4 py-5 md:px-6 lg:col-start-1 lg:row-start-1">
        <div className="h-14 animate-pulse rounded-xl bg-sand" />
        <div className="mt-6 border-b border-black/10 pb-5">
          <div className="h-4 w-28 animate-pulse rounded-full bg-sand" />
          <div className="mt-3 h-9 w-64 animate-pulse rounded-full bg-sand" />
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-panel bg-white shadow-soft" />
          <div className="h-32 animate-pulse rounded-panel bg-white shadow-soft" />
          <div className="h-32 animate-pulse rounded-panel bg-white shadow-soft" />
        </div>
        <div className="mt-5 h-72 animate-pulse rounded-panel bg-white shadow-soft" />
      </main>
    </div>
  );
}
