function SkeletonBox({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-white/[0.04] relative overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="glow-card p-3" aria-hidden="true">
      <SkeletonBox className="aspect-square rounded-2xl mb-3" />
      <SkeletonBox className="h-4 mb-1.5" />
      <SkeletonBox className="h-3 w-2/3 mb-2" />
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="w-9 h-9 rounded-xl" />
      </div>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="pb-24 px-4 pt-4" aria-label="Loading..." role="status">
      <SkeletonBox className="h-12 rounded-2xl mb-4 max-w-lg md:max-w-2xl mx-auto" />
      <div className="max-w-lg md:max-w-2xl mx-auto grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ListPageSkeleton() {
  return (
    <div className="pb-24 px-4 pt-4 max-w-lg md:max-w-2xl mx-auto" aria-label="Loading..." role="status">
      <SkeletonBox className="h-12 rounded-2xl mb-4" />
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonBox key={i} className="h-20 rounded-2xl mb-3" />
      ))}
    </div>
  );
}
