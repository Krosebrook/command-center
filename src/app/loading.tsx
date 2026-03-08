export default function Loading() {
  return (
    <div className="max-w-6xl space-y-6" role="status" aria-label="Loading page">
      {/* Header skeleton */}
      <div>
        <div className="h-7 w-48 shimmer rounded-lg" />
        <div className="h-4 w-72 shimmer rounded-lg mt-2" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="hud-card p-4 space-y-2">
            <div className="h-3 w-16 shimmer rounded" />
            <div className="h-7 w-12 shimmer rounded" />
          </div>
        ))}
      </div>

      {/* Health bar skeleton */}
      <div className="hud-card p-5 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-24 shimmer rounded" />
          <div className="h-4 w-32 shimmer rounded" />
        </div>
        <div className="h-4 w-full shimmer rounded-full" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-24 shimmer rounded" />
          ))}
        </div>
      </div>

      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="hud-card p-5 space-y-3">
            <div className="flex justify-between">
              <div className="h-5 w-32 shimmer rounded" />
              <div className="h-5 w-16 shimmer rounded-full" />
            </div>
            <div className="h-4 w-full shimmer rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-14 shimmer rounded" />
              <div className="h-5 w-14 shimmer rounded" />
            </div>
          </div>
        ))}
      </div>

      <span className="sr-only">Loading...</span>
    </div>
  );
}
