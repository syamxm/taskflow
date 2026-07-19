export function SkeletonCard() {
  return (
    <div className="rounded-card bg-white/[0.02] ring-1 ring-white/5 p-1.5">
      <div className="rounded-card-inner bg-gray-900/80 border border-white/10 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded bg-white/[0.06]" />
          <div className="h-4 w-32 rounded bg-white/[0.06]" />
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <div className="h-5 w-16 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-12 rounded-full bg-white/[0.06]" />
          <div className="h-5 w-20 rounded-full bg-white/[0.06]" />
        </div>
        <div className="h-3 w-full rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
