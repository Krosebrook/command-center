import { scanDrive } from "@/lib/scanner";
import { readFileContent, parseTodoItems } from "@/lib/parser";
import { KEY_FILES } from "@/lib/config";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CleanupPage() {
  const [stats, todoContent] = await Promise.all([
    scanDrive(),
    readFileContent(KEY_FILES.todo),
  ]);

  const todos = parseTodoItems(todoContent);
  const pending = todos.filter((t) => !t.done);
  const completed = todos.filter((t) => t.done);

  const sortedFolders = [...stats.folders].sort(
    (a, b) => b.totalSize - a.totalSize
  );

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cleanup Tracker</h1>
        <p className="text-muted-foreground mt-1">
          Track cleanup progress and disk usage
        </p>
      </div>

      {/* Progress */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Task Progress</h2>
          <span className="text-sm text-muted-foreground">
            {completed.length}/{todos.length} done
          </span>
        </div>
        <div className="h-3 rounded-full bg-accent overflow-hidden mb-4">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{
              width: `${
                todos.length > 0 ? (completed.length / todos.length) * 100 : 0
              }%`,
            }}
          />
        </div>

        {pending.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium mb-2 text-amber-400">
              Pending ({pending.length})
            </h3>
            <div className="space-y-1.5">
              {pending.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-muted-foreground mt-0.5">&#9633;</span>
                  <span>{item.text}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
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
                  <span className="text-emerald-400 mt-0.5">&#9745;</span>
                  <span className="line-through text-muted-foreground">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Disk Usage */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Disk Usage by Folder</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-accent">
                <th className="text-left p-3 font-medium">Folder</th>
                <th className="text-right p-3 font-medium">Root Files</th>
                <th className="text-right p-3 font-medium">Root Size</th>
                <th className="text-left p-3 font-medium w-48">Bar</th>
              </tr>
            </thead>
            <tbody>
              {sortedFolders.map((folder) => {
                const pct =
                  stats.totalSize > 0
                    ? (folder.totalSize / stats.totalSize) * 100
                    : 0;
                return (
                  <tr
                    key={folder.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="p-3 font-mono">{folder.name}</td>
                    <td className="p-3 text-right text-muted-foreground">
                      {folder.fileCount}
                    </td>
                    <td className="p-3 text-right">
                      {formatBytes(folder.totalSize)}
                    </td>
                    <td className="p-3">
                      <div className="h-2 rounded-full bg-accent overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cleanup History */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Recent Cleanup Actions</h2>
        <div className="space-y-2 text-sm">
          {[
            { date: "2026-03-03", action: "Deleted NulFile/ (only nul artifacts)" },
            { date: "2026-03-03", action: "Archived tmp/claude/ diffs to Backups" },
            { date: "2026-03-03", action: "Secured stray client_secret to user profile" },
            { date: "2026-03-03", action: "Removed nul artifacts from 00_Core/, Skills/" },
            { date: "2026-02-13", action: "Homebase-centric restructure completed" },
          ].map((entry, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground font-mono">
                {entry.date}
              </span>
              <span className="text-emerald-400">&#10003;</span>
              <span>{entry.action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
