import { cn } from "@/lib/utils";

interface ProjectCardProps {
  name: string;
  description: string;
  techStack: readonly string[];
  status: string;
  path: string;
  fileCount?: number;
  lastModified?: string;
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
      <div className="flex flex-wrap gap-1.5 mb-3">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="text-[10px] px-2 py-0.5 rounded bg-accent/80 text-accent-foreground font-mono"
          >
            {tech}
          </span>
        ))}
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
