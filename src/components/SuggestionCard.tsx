"use client";

import { cn } from "@/lib/utils";
import type { SuggestionAction, Confidence, Suggestion, SuggestionStatus } from "@/lib/types";

// -- Helpers ----------------------------------------------------------------

const ACTION_STYLES: Record<SuggestionAction, { label: string; cls: string }> =
  {
    move: { label: "Move", cls: "text-blue-400 bg-primary/5 border-blue-500/20" },
    "create-index": {
      label: "Create Index",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    "create-file": {
      label: "Create File",
      cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    archive: {
      label: "Archive",
      cls: "text-amber-400 bg-amber-500/5 border-amber-500/20",
    },
    delete: {
      label: "Delete",
      cls: "text-red-400 bg-red-500/10 border-red-500/20",
    },
  };

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  high: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/5 border-amber-500/20",
  low: "text-muted-foreground bg-accent border-border",
};

// -- Icons ------------------------------------------------------------------

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("w-4 h-4 animate-spin", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <circle cx="12" cy="12" r="10" className="opacity-25" />
      <path d="M4 12a8 8 0 018-8" className="opacity-75" />
    </svg>
  );
}

// -- Component --------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: Suggestion;
  onAccept: (id: string) => void;
  onDismiss: (id: string) => void;
  status?: SuggestionStatus;
}

export function SuggestionCard({
  suggestion,
  onAccept,
  onDismiss,
  status = "pending",
}: SuggestionCardProps) {
  const actionStyle = ACTION_STYLES[suggestion.action];
  const confidenceStyle = CONFIDENCE_STYLES[suggestion.confidence];

  const borderColor = cn({
    "border-emerald-500/40": status === "done",
    "border-red-500/40": status === "error",
    "border-border": status !== "done" && status !== "error",
  });

  return (
    <div
      role="article"
      aria-label={suggestion.title}
      className={cn(
        "rounded-xl border bg-card p-5 transition-all",
        borderColor,
        status === "dismissed" && "opacity-50"
      )}
    >
      {/* Header row: title + badges */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-bold leading-snug">{suggestion.title}</h3>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border",
              confidenceStyle
            )}
          >
            {suggestion.confidence}
          </span>
          <span
            className={cn(
              "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border",
              actionStyle.cls
            )}
          >
            {actionStyle.label}
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-3">
        {suggestion.description}
      </p>

      {/* Paths */}
      <div className="space-y-1 mb-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Source:</span>
          <span className="font-mono truncate">{suggestion.source}</span>
        </div>
        {suggestion.destination && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Dest:</span>
            <span className="font-mono truncate">{suggestion.destination}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2" aria-live="polite">
        {status === "executing" ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner />
            <span>Executing...</span>
          </div>
        ) : status === "done" ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckIcon />
            <span>Done</span>
          </div>
        ) : status === "error" ? (
          <span className="text-sm text-red-400">
            Error &mdash; action failed
          </span>
        ) : (
          <>
            <button
              onClick={() => onAccept(suggestion.id)}
              disabled={status === "accepted"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                status === "accepted"
                  ? "bg-primary/10 text-primary cursor-default"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {status === "accepted" && <CheckIcon className="w-3 h-3" />}
              Accept
            </button>
            <button
              onClick={() => onDismiss(suggestion.id)}
              disabled={status === "accepted" || status === "dismissed"}
              className="inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground bg-accent hover:bg-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Dismiss
            </button>
          </>
        )}
      </div>
    </div>
  );
}
