"use client";

import { useEffect, useState } from "react";

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary?: () => void;
  title?: string;
}

export function ErrorFallback({ error, resetErrorBoundary, title = "Something went wrong" }: ErrorFallbackProps) {
  return (
    <div className="hud-card p-5 border-red-500/20" role="alert">
      <h3 className="font-semibold text-red-400 text-sm mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-3">{error.message}</p>
      {resetErrorBoundary && (
        <button
          onClick={resetErrorBoundary}
          className="text-xs font-mono uppercase tracking-wide text-primary hover:text-primary/80 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
