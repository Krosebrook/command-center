import { scanDrive } from "@/lib/scanner";
import { readFileContent, parseTodoItems } from "@/lib/parser";
import { KEY_FILES, WALKTHROUGH_LOG_PATH } from "@/lib/config";
import { formatBytes } from "@/lib/utils";
import fs from "fs/promises";
import type { WalkthroughLogEntry } from "@/lib/types";

function parseLogSafely(content: string | null): WalkthroughLogEntry[] {
  if (!content) return [];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export const dynamic = "force-dynamic";

export default async function CleanupPage() {
  const [stats, todoContent, logContent] = await Promise.all([
    scanDrive(),
    readFileContent(KEY_FILES.todo),
    fs.readFile(WALKTHROUGH_LOG_PATH, "utf-8").catch(() => null),
  ]);

  const walkthroughLog = parseLogSafely(logContent);
  const recentActions = [...walkthroughLog].reverse().slice(0, 10);
  const todos = parseTodoItems(todoContent);
  const pending = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);
  const sortedFolders = [...stats.folders].sort((a, b) => b.totalSize - a.totalSize);

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Cleanup Tracker</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Track cleanup progress and disk usage
        </p>
      </div>

      {/* Progress */}
      <section className="hud-card p-4 sm:p-5" aria-labelledby="progress-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="progress-heading" className="font-semibold">Task Progress</h2>
          <span className="text-sm text-muted-foreground">
            {completed.length}/{todos.length} done
          </span>
        </div>
        <div
          className="h-3 rounded-full bg-accent overflow-hidden mb-4"
          role="progressbar"
          aria-valuenow={todos.length > 0 ? Math.round((completed.length / todos.length) * 100) : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${completed.length} of ${todos.length} tasks completed`}
        >
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{
              width: `${todos.length > 0 ? (completed.length / todos.length) * 100 : 0}%`,
            }}
          />
        </div>

        {todos.length === 0 && (
          <p className="text-sm text-muted-foreground">No TODO items found. Create a TODO.md in D:\00_Core\ to track tasks.</p>
        )}

        {pending.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-amber-400">
              Pending ({pending.length})
            </h3>
            <div className="space-y-1.5">
              {pending.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-0.5" aria-hidden="true">&#9633;</span>
                  <span className="flex-1 min-w-0">{item.text}</span>
                  <span className="text-xs text-muted-foreground ml-auto shrink-0 hidden sm:block">
                    {item.section}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {completed.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2 text-emerald-400">
              Completed ({completed.length})
            </h3>
            <div className="space-y-1.5">
              {completed.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-emerald-400 mt-0.5" aria-hidden="true">&#9745;</span>
                  <span className="line-through text-muted-foreground">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Disk Usage */}
      {sortedFolders.length > 0 && (
        <section aria-labelledby="disk-heading">
          <h2 id="disk-heading" className="text-lg font-semibold mb-4">Disk Usage by Folder</h2>
          <div className="hud-card overflow-x-auto">
            <table className="w-full text-sm min-w-[450px]">
              <thead>
                <tr className="border-b border-border bg-accent">
                  <th className="text-left p-3 font-medium" scope="col">Folder</th>
                  <th className="text-right p-3 font-medium" scope="col">Root Files</th>
                  <th className="text-right p-3 font-medium" scope="col">Root Size</th>
                  <th className="text-left p-3 font-medium w-32 sm:w-48" scope="col">
                    <span className="sr-only">Size bar</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedFolders.map((folder) => {
                  const pct = stats.totalSize > 0 ? (folder.totalSize / stats.totalSize) * 100 : 0;
                  return (
                    <tr key={folder.name} className="border-b border-border last:border-0">
                      <td className="p-3 font-mono text-xs sm:text-sm">{folder.name}</td>
                      <td className="p-3 text-right text-muted-foreground">{folder.fileCount}</td>
                      <td className="p-3 text-right">{formatBytes(folder.totalSize)}</td>
                      <td className="p-3">
                        <div
                          className="h-2 rounded-full bg-accent overflow-hidden"
                          role="meter"
                          aria-valuenow={Math.round(pct)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${folder.name}: ${Math.round(pct)}% of total`}
                        >
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Cleanup History */}
      <section className="hud-card p-4 sm:p-5" aria-labelledby="history-heading">
        <h2 id="history-heading" className="font-semibold mb-3">Recent Cleanup Actions</h2>
        {recentActions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No walkthrough actions recorded yet. Run the Drive Walkthrough to log actions here.
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            {recentActions.map((entry, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <span className="text-xs text-muted-foreground font-mono shrink-0">
                  {entry.timestamp?.slice(0, 10) ?? "unknown"}
                </span>
                <span className="text-emerald-400" aria-hidden="true">&#10003;</span>
                <span className="capitalize">{entry.action}</span>
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[400px]">
                  {entry.source}
                  {entry.destination ? ` \u2192 ${entry.destination}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
