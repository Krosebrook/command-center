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
    <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-foreground">{name}</h3>
        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          {status} v{version}
        </span>
      </div>
      <p className="text-xs font-medium text-primary mb-1">{role}</p>
      <p className="text-sm text-muted-foreground mb-4">{purpose}</p>
      <div className="flex items-center justify-between">
        <code className="text-xs bg-accent px-2 py-1 rounded font-mono">
          {command}
        </code>
        <span className="text-xs text-muted-foreground font-mono">{file}</span>
      </div>
    </div>
  );
}
