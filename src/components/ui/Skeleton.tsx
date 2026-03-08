import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-accent",
        className,
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3" role="status" aria-label="Loading content">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden" role="status" aria-label="Loading table">
      <div className="p-3 bg-accent">
        <Skeleton className="h-4 w-full" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-3 border-t border-border flex gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
        </div>
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
