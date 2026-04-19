export default function PortalLoading() {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 py-6 md:px-6">
      <div className="rounded-panel bg-white/85 p-5 shadow-soft">
        <div className="h-4 w-28 animate-pulse rounded-full bg-sand" />
        <div className="mt-4 h-8 w-52 animate-pulse rounded-full bg-sand" />
        <div className="mt-5 flex flex-wrap gap-2">
          <div className="h-9 w-24 animate-pulse rounded-full bg-sand" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-sand" />
          <div className="h-9 w-24 animate-pulse rounded-full bg-sand" />
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="h-36 animate-pulse rounded-panel bg-white shadow-soft" />
        <div className="h-36 animate-pulse rounded-panel bg-white shadow-soft" />
      </div>
      <div className="mt-5 h-72 animate-pulse rounded-panel bg-white shadow-soft" />
    </div>
  );
}
