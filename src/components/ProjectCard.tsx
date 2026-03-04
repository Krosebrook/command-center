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

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  planning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  archived: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

export function ProjectCard({
  name,
  description,
  techStack,
  status,
  path,
  fileCount,
  lastModified,
}: ProjectCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <span
          className={cn(
            "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border",
            statusColors[status] ?? statusColors.archived
          )}
        >
          {status}
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <div className="flex flex-wrap gap-1.5 mb-4">
        {techStack.map((tech) => (
          <span
            key={tech}
            className="text-[11px] px-2 py-0.5 rounded-md bg-accent text-accent-foreground"
          >
            {tech}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-mono truncate max-w-[200px]" title={path}>
          {path}
        </span>
        <div className="flex gap-3">
          {fileCount !== undefined && <span>{fileCount} files</span>}
          {lastModified && <span>{lastModified}</span>}
        </div>
      </div>
    </div>
  );
}
