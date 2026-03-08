"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Page error:", error);
  }, [error]);

  return (
    <div className="max-w-6xl">
      <div className="hud-card border-red-500/20 p-8 text-center">
        {/* Error icon */}
        <div className="mx-auto mb-4 h-16 w-16 rounded-full border-2 border-red-500/30 flex items-center justify-center">
          <svg
            className="h-8 w-8 text-red-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h2 className="text-sm font-mono uppercase tracking-widest text-red-400 mb-2">
          System Error
        </h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
