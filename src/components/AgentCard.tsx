import { cn } from "@/lib/utils";

interface AgentCardProps {
  name: string;
  role: string;
  purpose: string;
  version: string;
  status: string;
  file: string;
  invocation?: string;
}

export function AgentCard({
  name,
  role,
  purpose,
  version,
  status,
  file,
  invocation,
}: AgentCardProps) {
  const command = invocation ?? `@${name.toLowerCase()}-agent`;

  return (
    <div className="hud-card p-4 sm:p-5 group transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
          {name}
        </h3>
        <span className="inline-flex items-center gap-1.5 text-[9px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border text-emerald-400 bg-emerald-500/10 border-emerald-500/20">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          {status} v{version}
        </span>
      </div>
      <p className="text-xs font-medium text-primary/80 mb-1 font-mono uppercase tracking-wide">
        {role}
      </p>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{purpose}</p>
      <div className="flex items-center justify-between">
        <code className="text-[10px] bg-accent/80 px-2 py-1 rounded font-mono text-primary/80">
          {command}
        </code>
        <span className="text-[10px] text-muted-foreground font-mono">{file}</span>
      </div>
    </div>
  );
}
