import { cn } from "@/lib/utils";

interface ProjectCardProps {
  name: string;
  description: string;
  techStack: readonly string[];
  status: string;
  path: string;
  fileCount?: number;
  lastModified?: string;
  git?: {
    isRepo: boolean;
    branch: string | null;
    hasChanges: boolean;
    unpushed: boolean;
  };
}

const statusConfig: Record<string, { label: string; cls: string; dot: string }> = {
  active: {
    label: "ONLINE",
    cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  planning: {
    label: "STAGED",
    cls: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400",
  },
  archived: {
    label: "OFFLINE",
    cls: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
    dot: "bg-zinc-400",
  },
  missing: {
    label: "NOT FOUND",
    cls: "text-red-400 bg-red-500/10 border-red-500/20",
    dot: "bg-red-400",
  },
};

export function ProjectCard({
  name,
  description,
  techStack,
  status,
  path: projectPath,
  fileCount,
  lastModified,
  git,
}: ProjectCardProps) {
  const config = statusConfig[status] ?? statusConfig.archived;

  return (
    <div className="hud-card p-4 sm:p-5 group transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border",
            config.cls,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
          {config.label}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="text-[10px] px-2 py-0.5 rounded bg-accent/80 text-accent-foreground font-mono"
          >
            {tech}
          </span>
        ))}
        {git?.isRepo && git.branch && (
          <span className="text-[10px] px-2 py-0.5 rounded border border-primary/20 text-primary font-mono flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
            {git.branch}
            {git.hasChanges && <span className="text-amber-400" title="Uncommitted changes">*</span>}
            {git.unpushed && <span className="text-blue-400" title="Unpushed commits">↑</span>}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
        <span className="truncate max-w-[160px] sm:max-w-[200px]" title={projectPath}>
          {projectPath}
        </span>
        <div className="flex gap-3 shrink-0">
          {fileCount !== undefined && <span>{fileCount} files</span>}
          {lastModified && <span>{lastModified}</span>}
        </div>
      </div>
    </div>
  );
}
