import { scanDrive } from "@/lib/scanner";
import { PROJECTS } from "@/lib/config";
import { ProjectCard } from "@/components/ProjectCard";
import { DriveHealthBar } from "@/components/DriveHealthBar";
import { formatBytes, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await scanDrive();

  const needsAttention = stats.folders.filter(
    (f) => f.name === "07_Downloads" || f.name === "08_Documentation"
  );

  return (
    <div className="max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Drive health overview &middot; Last scan {timeAgo(stats.lastScan)}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Top-Level Folders" value={String(stats.folders.length)} />
        <StatCard label="Root Files Scanned" value={String(stats.totalFiles)} />
        <StatCard label="Root Size" value={formatBytes(stats.totalSize)} />
        <StatCard
          label="Needs Attention"
          value={String(needsAttention.length)}
          highlight={needsAttention.length > 0}
        />
      </div>

      {/* Drive Health */}
      <div className="rounded-xl border border-border bg-card p-5">
        <DriveHealthBar folders={stats.folders} totalSize={stats.totalSize} />
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <h2 className="font-semibold text-amber-400 mb-3">Needs Attention</h2>
          <div className="space-y-2">
            {needsAttention.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-sm">
                <span className="font-mono">{f.name}</span>
                <span className="text-muted-foreground">
                  {f.fileCount} files &middot; {formatBytes(f.totalSize)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Key Projects</h2>
        <div className="grid grid-cols-2 gap-4">
          {PROJECTS.map((project) => (
            <ProjectCard key={project.name} {...project} />
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold mb-3">Quick Navigation</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Active Projects", path: "D:\\01_Homebase\\03_Projects\\" },
            { label: "Source of Truth", path: "D:\\01_Homebase\\01_Source-of-Truth\\" },
            { label: "Automations", path: "D:\\01_Homebase\\02_Automations\\" },
            { label: "Scripts", path: "D:\\02_Development\\Scripts\\" },
            { label: "Skills", path: "D:\\02_Development\\Skills\\" },
            { label: "Copilot Agents", path: "D:\\02_Development\\CopilotAgents\\" },
            { label: "Documentation", path: "D:\\08_Documentation\\" },
            { label: "Downloads", path: "D:\\07_Downloads\\" },
            { label: "Backups", path: "D:\\05_Backups-Archive\\" },
          ].map((link) => (
            <div
              key={link.label}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent text-sm"
            >
              <span>{link.label}</span>
              <span className="text-xs text-muted-foreground font-mono truncate ml-2 max-w-[180px]">
                {link.path}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-amber-500/20 bg-amber-500/5"
          : "border-border bg-card"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-2xl font-bold mt-1 ${
          highlight ? "text-amber-400" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
