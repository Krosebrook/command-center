"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";
import type { ScanIssueType, Severity, ScanResult, DeepScanResult } from "@/lib/types";

// -- Helpers ----------------------------------------------------------------

const TYPE_LABELS: Record<ScanIssueType, string> = {
  "missing-index": "Missing Index",
  orphaned: "Orphaned Files",
  stale: "Stale Items",
  unsorted: "Unsorted",
  "large-file": "Large Files",
  "empty-dir": "Empty Directories",
  "missing-governance": "Missing Governance",
};

const SEVERITY_STYLES: Record<
  Severity,
  { dot: string; badge: string; label: string }
> = {
  info: {
    dot: "bg-blue-400",
    badge: "text-blue-400 bg-primary/5 border-blue-500/20",
    label: "Info",
  },
  warning: {
    dot: "bg-amber-400",
    badge: "text-amber-400 bg-amber-500/5 border-amber-500/20",
    label: "Warning",
  },
  action: {
    dot: "bg-red-400",
    badge: "text-red-400 bg-red-500/10 border-red-500/20",
    label: "Action",
  },
};

// -- Component --------------------------------------------------------------

interface ScanResultsProps {
  results: DeepScanResult | null;
  loading: boolean;
}

export function ScanResults({ results, loading }: ScanResultsProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  if (loading) {
    return (
      <div role="status" className="rounded-xl border border-border bg-card p-5 animate-pulse">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
          <span className="text-sm text-muted-foreground">
            Scanning drive...
          </span>
        </div>
      </div>
    );
  }

  if (!results) return null;

  // Group results by type
  const grouped = results.results.reduce<Record<ScanIssueType, ScanResult[]>>(
    (acc, r) => {
      (acc[r.type] ??= []).push(r);
      return acc;
    },
    {} as Record<ScanIssueType, ScanResult[]>
  );

  const toggle = (type: string) =>
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }));

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {(["info", "warning", "action"] as Severity[]).map((sev) => {
          const s = SEVERITY_STYLES[sev];
          return (
            <div
              key={sev}
              aria-label={`${SEVERITY_STYLES[sev].label}: ${results.bySeverity[sev]} issues`}
              className={cn("rounded-xl border bg-card p-5", {
                "border-blue-500/20": sev === "info",
                "border-amber-500/20": sev === "warning",
                "border-red-500/20": sev === "action",
              })}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {s.label}
                </span>
              </div>
              <p className="text-2xl font-bold">{results.bySeverity[sev]}</p>
            </div>
          );
        })}
      </div>

      {/* Scanned timestamp */}
      <p className="text-xs text-muted-foreground">
        Scanned {new Date(results.scannedAt).toLocaleString()} &mdash;{" "}
        {results.totalIssues} total issues
      </p>

      {/* Grouped issue list */}
      <div className="space-y-4">
        {(Object.keys(grouped) as ScanIssueType[]).map((type) => {
          const items = grouped[type];
          const isOpen = !collapsed[type];

          return (
            <div
              key={type}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              {/* Group header */}
              <button
                onClick={() => toggle(type)}
                aria-expanded={isOpen}
                aria-controls={`scan-group-${type}`}
                className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/50"
              >
                <div className="flex items-center gap-3">
                  <svg
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      isOpen && "rotate-90"
                    )}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                  <span className="text-sm font-semibold">
                    {TYPE_LABELS[type] ?? type}
                  </span>
                </div>
                <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                  {items.length}
                </span>
              </button>

              {/* Issue rows */}
              {isOpen && (
                <div id={`scan-group-${type}`} className="border-t border-border divide-y divide-border">
                  {items.map((item, i) => {
                    const sev = SEVERITY_STYLES[item.severity];
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 px-4 py-3 text-sm"
                      >
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            sev.dot
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-xs truncate">
                            {item.path}
                          </p>
                          <p className="text-muted-foreground mt-0.5">
                            {item.details}
                            {item.size != null && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                ({formatBytes(item.size)})
                              </span>
                            )}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-medium uppercase px-2 py-0.5 rounded-full border shrink-0",
                            sev.badge
                          )}
                        >
                          {sev.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
