export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}

export function ListRowSkeleton({ count = 4 }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-200 p-4"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />

          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageListSkeleton() {
  const widths = ["w-40", "w-56", "w-32", "w-48", "w-28", "w-52"];

  return (
    <div className="flex-1 space-y-4 overflow-hidden p-6">
      {widths.map((width, i) => (
        <div
          key={i}
          className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
        >
          <Skeleton className={`h-10 ${width} rounded-2xl`} />
        </div>
      ))}
    </div>
  );
}