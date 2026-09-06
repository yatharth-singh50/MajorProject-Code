import { cx } from "../../utils/format";

export function Skeleton({ className = "" }) {
  return <div className={cx("animate-pulse-soft rounded-md bg-bg-inset", className)} />;
}

export function PostSkeleton() {
  return (
    <div className="flex gap-3 border-b border-border px-4 py-4">
      <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2.5 py-0.5">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-5/6" />
        <Skeleton className="h-16 w-full max-w-xs rounded-xl" />
      </div>
    </div>
  );
}
