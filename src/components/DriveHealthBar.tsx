import { formatBytes } from "@/lib/utils";
import type { FolderInfo } from "@/lib/scanner";

interface DriveHealthBarProps {
  folders: FolderInfo[];
  totalSize: number;
}

const colors = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-purple-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-lime-500",
  "bg-sky-500",
  "bg-fuchsia-500",
  "bg-red-500",
];

export function DriveHealthBar({ folders, totalSize }: DriveHealthBarProps) {
  const sorted = [...folders].sort((a, b) => b.totalSize - a.totalSize);

  if (sorted.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No folder data available
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Drive Usage</span>
        <span className="text-sm text-muted-foreground">
          {formatBytes(totalSize)} scanned
        </span>
      </div>
      <div
        className="h-4 rounded-full bg-accent overflow-hidden flex"
        role="img"
        aria-label={`Drive usage breakdown: ${sorted.slice(0, 5).map(f => `${f.name} ${formatBytes(f.totalSize)}`).join(', ')}`}
      >
        {sorted.map((folder, i) => {
          const pct = totalSize > 0 ? (folder.totalSize / totalSize) * 100 : 0;
          if (pct < 1) return null;
          return (
            <div
              key={folder.name}
              className={`${colors[i % colors.length]} opacity-80 transition-all`}
              style={{ width: `${pct}%` }}
              title={`${folder.name}: ${formatBytes(folder.totalSize)} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {sorted.slice(0, 8).map((folder, i) => (
          <div key={folder.name} className="flex items-center gap-1.5 text-xs">
            <div
              className={`w-2 h-2 rounded-full ${colors[i % colors.length]} shrink-0`}
              aria-hidden="true"
            />
            <span className="text-muted-foreground">
              {folder.name}: {formatBytes(folder.totalSize)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
