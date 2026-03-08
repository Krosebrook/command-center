"use client";

import { useState } from "react";

interface ContextPreviewProps {
  projectName: string;
  context: string;
  files: string[];
}

export function ContextPreview({ projectName, context, files }: ContextPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(context);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div role="region" aria-label="Context preview" className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{projectName} Context Bundle</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {files.length} files collected
          </p>
        </div>
        <button
          onClick={handleCopy}
          aria-label="Copy context to clipboard"
          aria-live="polite"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {copied ? "Copied!" : "Copy Context"}
        </button>
      </div>
      <div className="p-4">
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Files included:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {files.map((f) => (
              <span
                key={f}
                className="text-[11px] px-2 py-0.5 rounded bg-accent font-mono"
              >
                {f}
              </span>
            ))}
          </div>
        </div>
        <pre className="text-xs bg-background rounded-lg p-4 overflow-auto max-h-96 font-mono text-muted-foreground whitespace-pre-wrap">
          {context.slice(0, 5000)}
          {context.length > 5000 && "\n\n... (truncated for preview)"}
        </pre>
      </div>
    </div>
  );
}
