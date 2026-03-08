import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "info" | "warning" | "danger" | "success" | "muted";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "text-foreground bg-accent border-border",
  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  warning: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  danger: "text-red-400 bg-red-500/10 border-red-500/20",
  success: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  muted: "text-muted-foreground bg-accent border-border",
};

export function Badge({ variant = "default", children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
