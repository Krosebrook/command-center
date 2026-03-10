import { Suspense } from "react";
import { scanDrive } from "@/lib/scanner";
import { PROJECTS, FOLDERS } from "@/lib/config";
import { ProjectCard } from "@/components/ProjectCard";
import { DriveHealthBar } from "@/components/DriveHealthBar";
import { SemanticSearch } from "@/components/SemanticSearch";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { formatBytes, timeAgo } from "@/lib/utils";
import { getGitStatus } from "@/lib/git-utils";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await scanDrive();
  const driveAvailable = stats.folders.length > 0;
  const needsAttention = stats.folders.filter(
    (f) => f.name === "07_Downloads" || f.name === "08_Documentation",
  );

  const gitStatuses = await Promise.all(PROJECTS.map(p => getGitStatus(p.path)));

  return (
    <div className="max-w-6xl space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-mono">
          {driveAvailable
            ? <>SYSTEM OK &middot; Last scan {timeAgo(stats.lastScan)}</>
            : <span className="text-amber-400">DRIVE OFFLINE &middot; No connection</span>}
        </p>
      </div>

      {!driveAvailable && (
        <div
          className="hud-card p-4 border-amber-500/30 text-sm text-amber-400 flex items-center gap-3"
          role="alert"
        >
          <div className="h-2 w-2 rounded-full bg-amber-400 status-pulse shrink-0" />
          D:\ drive is not accessible. Check that it is mounted and try refreshing.
        </div>
      )}

      {/* Semantic Local Search */}
      <SemanticSearch />
      
      {/* Analytics */}
      <AnalyticsCharts />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
        <StatCard
          label="Folders"
          value={String(stats.folders.length)}
          mono
        />
        <StatCard
          label="Root Files"
          value={String(stats.totalFiles)}
          mono
        />
        <StatCard
          label="Scanned"
          value={formatBytes(stats.totalSize)}
        />
        <StatCard
          label="Attention"
          value={String(needsAttention.length)}
          highlight={needsAttention.length > 0}
          mono
        />
      </div>

      {/* Drive Health */}
      {driveAvailable && (
        <Suspense fallback={<div className="hud-card p-5 animate-pulse h-32" />}>
          <div className="hud-card p-4 sm:p-5">
            <DriveHealthBar folders={stats.folders} totalSize={stats.totalSize} />
          </div>
        </Suspense>
      )}

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <div className="hud-card p-4 sm:p-5 border-amber-500/20" role="alert">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <h2 className="font-semibold text-amber-400 text-sm uppercase tracking-wide font-mono">
              Needs Attention
            </h2>
          </div>
          <div className="space-y-2">
            {needsAttention.map((f) => (
              <div key={f.name} className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs">{f.name}</span>
                <span className="text-muted-foreground font-mono text-xs">
                  {f.fileCount} files &middot; {formatBytes(f.totalSize)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      <Suspense fallback={<div className="hud-card p-5 animate-pulse h-48" />}>
        <section aria-labelledby="projects-heading">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-border/50" />
            <h2 id="projects-heading" className="text-xs font-mono uppercase tracking-widest text-muted-foreground px-3">
              Key Projects
            </h2>
            <div className="h-px flex-1 bg-border/50" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 stagger-children">
            {PROJECTS.map((project, idx) => (
              <ProjectCard key={project.name} {...project} git={gitStatuses[idx]} />
            ))}
          </div>
        </section>
      </Suspense>

      {/* Quick Links */}
      <section className="hud-card p-4 sm:p-5" aria-labelledby="quicknav-heading">
        <h2 id="quicknav-heading" className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-4">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {[
            { label: "Active Projects", pathStr: path.join(FOLDERS.homebase, "03_Projects") + path.sep },
            { label: "Source of Truth", pathStr: path.join(FOLDERS.homebase, "01_Source-of-Truth") + path.sep },
            { label: "Automations", pathStr: path.join(FOLDERS.homebase, "02_Automations") + path.sep },
            { label: "Scripts", pathStr: path.join(FOLDERS.development, "Scripts") + path.sep },
            { label: "Skills", pathStr: path.join(FOLDERS.development, "Skills") + path.sep },
            { label: "Copilot Agents", pathStr: path.join(FOLDERS.development, "CopilotAgents") + path.sep },
            { label: "Documentation", pathStr: FOLDERS.documentation + path.sep },
            { label: "Downloads", pathStr: FOLDERS.downloads + path.sep },
            { label: "Backups", pathStr: FOLDERS.backups + path.sep },
          ].map((link) => (
            <div
              key={link.label}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-accent/50 hover:bg-accent transition-colors text-sm group"
            >
              <span className="text-foreground/80 group-hover:text-foreground transition-colors">
                {link.label}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono truncate ml-2 max-w-[120px] sm:max-w-[160px]">
                {link.pathStr}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  mono = false,
}: Readonly<{
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}>) {
  return (
    <div
      className={`hud-card p-3 sm:p-4 ${
        highlight ? "border-amber-500/30" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">
        {label}
      </p>
      <p
        className={`text-xl sm:text-2xl font-bold mt-0.5 ${
          highlight ? "text-amber-400 text-glow" : ""
        } ${mono ? "stat-value" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
