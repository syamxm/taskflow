export function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-4 h-4 rounded bg-gray-800" />
        <div className="h-4 w-32 rounded bg-gray-800" />
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <div className="h-5 w-16 rounded-full bg-gray-800" />
        <div className="h-5 w-12 rounded-full bg-gray-800" />
        <div className="h-5 w-20 rounded-full bg-gray-800" />
      </div>
      <div className="h-3 w-full rounded bg-gray-800" />
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
