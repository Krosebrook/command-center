// ---------------------------------------------------------------------------
// Shared types used across lib/, components/, and app/ layers
// ---------------------------------------------------------------------------

// -- Scan types -------------------------------------------------------------

export type ScanIssueType =
  | "missing-index"
  | "orphaned"
  | "stale"
  | "unsorted"
  | "large-file"
  | "empty-dir"
  | "missing-governance";

export type Severity = "info" | "warning" | "action";

export interface ScanResult {
  type: ScanIssueType;
  path: string;
  severity: Severity;
  details: string;
  size?: number;
  lastModified?: string; // ISO string
}

export interface DeepScanResult {
  results: ScanResult[];
  scannedAt: string;
  totalIssues: number;
  bySeverity: { info: number; warning: number; action: number };
  byType: Record<ScanIssueType, number>;
}

// -- Suggestion types -------------------------------------------------------

export type SuggestionAction = "move" | "create-index" | "create-file" | "archive" | "delete";
export type Confidence = "high" | "medium" | "low";

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  action: SuggestionAction;
  source: string;
  destination?: string;
  confidence: Confidence;
}

export type SuggestionStatus =
  | "pending"
  | "accepted"
  | "dismissed"
  | "executing"
  | "done"
  | "error";

// -- Walkthrough log types --------------------------------------------------

export interface WalkthroughLogEntry {
  action: string;
  source: string;
  destination?: string;
  timestamp: string;
}
