import path from "path";
import type { ScanResult } from "./deep-scanner";
import { SORT_RULES, FOLDERS } from "./config";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SuggestionAction = "move" | "create-index" | "archive" | "delete";
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONFIDENCE_ORDER: Record<Confidence, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const ACTION_ORDER: Record<SuggestionAction, number> = {
  move: 0,
  "create-index": 1,
  archive: 2,
  delete: 3,
};

/**
 * Return SORT_RULES keys sorted longest-first so that compound extensions
 * like ".agent.md" are checked before ".md".
 */
function getSortedRuleKeys(): string[] {
  return Object.keys(SORT_RULES).sort((a, b) => b.length - a.length);
}

/**
 * Check whether a filename ends with the given extension key (case-insensitive).
 */
function matchesExtension(filename: string, ext: string): boolean {
  return filename.toLowerCase().endsWith(ext.toLowerCase());
}

/**
 * Format a date string for human-readable descriptions.
 */
function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Build a date-prefixed archive path by replacing "Active" with "Archive"
 * and prepending the folder name with today's date.
 */
function buildArchivePath(sourcePath: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const folderName = path.basename(sourcePath);
  const parentDir = path.dirname(sourcePath).replace("Active", "Archive");
  return path.join(parentDir, `${today}_${folderName}`);
}

// ---------------------------------------------------------------------------
// Suggestion generators (one per ScanIssueType)
// ---------------------------------------------------------------------------

function handleUnsorted(result: ScanResult, index: number): Suggestion {
  const name = path.basename(result.path);
  const ext = path.extname(name);
  const ruleKeys = getSortedRuleKeys();

  // 1. Check file extension against SORT_RULES (longest match first)
  for (const key of ruleKeys) {
    if (matchesExtension(name, key)) {
      const rule = SORT_RULES[key];
      return {
        id: `suggestion-${index}`,
        title: `Move "${name}" to ${rule.label}`,
        description: `File matches sort rule for "${key}" extension. Move to ${rule.destination}.`,
        action: "move",
        source: result.path,
        destination: rule.destination,
        confidence: "high",
      };
    }
  }

  // 2. Directory ending with -main or -master (likely a GitHub repo)
  if (name.endsWith("-main") || name.endsWith("-master")) {
    return {
      id: `suggestion-${index}`,
      title: `Move "${name}" to Development`,
      description: `Directory name ends with "-main"/"-master", likely a GitHub repo clone.`,
      action: "move",
      source: result.path,
      destination: FOLDERS.development,
      confidence: "medium",
    };
  }

  // 3. Directory that may contain package.json (dev project indicators)
  const devIndicators = [
    "package.json",
    "Cargo.toml",
    "go.mod",
    "requirements.txt",
    "pyproject.toml",
    "pom.xml",
    "build.gradle",
  ];
  // We check the name heuristically -- the actual FS check happens at scan time,
  // but the details field from the scanner may hint at it.  For directories we
  // rely on the name-based heuristic or the details text.
  if (
    devIndicators.some(
      (indicator) =>
        result.details.toLowerCase().includes(indicator.toLowerCase()),
    )
  ) {
    return {
      id: `suggestion-${index}`,
      title: `Move "${name}" to Development`,
      description: `Directory appears to contain project files (package.json or similar). Likely a development project.`,
      action: "move",
      source: result.path,
      destination: FOLDERS.development,
      confidence: "medium",
    };
  }

  // 4. Fallback: unknown item
  const needsSortingDir = path.join(FOLDERS.backups, "NeedsSorting");
  return {
    id: `suggestion-${index}`,
    title: `Move "${name}" to NeedsSorting`,
    description: `No matching sort rule found. Move to ${needsSortingDir} for manual triage.`,
    action: "move",
    source: result.path,
    destination: needsSortingDir,
    confidence: "low",
  };
}

function handleMissingIndex(result: ScanResult, index: number): Suggestion {
  const folderName = path.basename(result.path);
  return {
    id: `suggestion-${index}`,
    title: `Create _INDEX.md in "${folderName}"`,
    description: "Create _INDEX.md with auto-generated contents listing.",
    action: "create-index",
    source: result.path,
    confidence: "high",
  };
}

function handleStale(result: ScanResult, index: number): Suggestion {
  const folderName = path.basename(result.path);
  const lastMod = result.lastModified
    ? formatDate(result.lastModified)
    : "unknown";
  return {
    id: `suggestion-${index}`,
    title: `Archive stale project "${folderName}"`,
    description: `Project has not been modified since ${lastMod}. Move from Active to Archive.`,
    action: "archive",
    source: result.path,
    destination: buildArchivePath(result.path),
    confidence: "medium",
  };
}

function handleEmptyDir(result: ScanResult, index: number): Suggestion {
  const folderName = path.basename(result.path);
  return {
    id: `suggestion-${index}`,
    title: `Delete empty directory "${folderName}"`,
    description: `Directory "${result.path}" is empty and can be safely removed.`,
    action: "delete",
    source: result.path,
    confidence: "low",
  };
}

function handleLargeFile(result: ScanResult, index: number): Suggestion {
  const fileName = path.basename(result.path);
  const largeFilesDir = path.join(FOLDERS.backups, "LargeFiles");
  return {
    id: `suggestion-${index}`,
    title: `Move large file "${fileName}" to archive`,
    description: `${result.details}. Move to ${largeFilesDir} to free up space.`,
    action: "move",
    source: result.path,
    destination: largeFilesDir,
    confidence: "low",
  };
}

function handleMissingGovernance(
  result: ScanResult,
  index: number,
): Suggestion {
  const fileName = path.basename(result.path);
  return {
    id: `suggestion-${index}`,
    title: `Create governance file "${fileName}"`,
    description: `${result.details}. Create the file to maintain drive governance structure.`,
    action: "create-index",
    source: result.path,
    confidence: "medium",
  };
}

function handleOrphaned(result: ScanResult, index: number): Suggestion {
  const name = path.basename(result.path);
  const needsSortingDir = path.join(FOLDERS.backups, "NeedsSorting");
  return {
    id: `suggestion-${index}`,
    title: `Move orphaned item "${name}" to NeedsSorting`,
    description: `Root item does not match the numbered folder convention. Move to ${needsSortingDir} for triage.`,
    action: "move",
    source: result.path,
    destination: needsSortingDir,
    confidence: "low",
  };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Generate actionable suggestions from deep-scan results.
 *
 * Pure function -- no side-effects or file system access.
 * Suggestions are sorted by confidence (high first), then by action type.
 */
export function generateSuggestions(results: ScanResult[]): Suggestion[] {
  const suggestions: Suggestion[] = [];
  let counter = 0;

  for (const result of results) {
    switch (result.type) {
      case "unsorted":
        suggestions.push(handleUnsorted(result, counter++));
        break;
      case "missing-index":
        suggestions.push(handleMissingIndex(result, counter++));
        break;
      case "stale":
        suggestions.push(handleStale(result, counter++));
        break;
      case "empty-dir":
        suggestions.push(handleEmptyDir(result, counter++));
        break;
      case "large-file":
        suggestions.push(handleLargeFile(result, counter++));
        break;
      case "missing-governance":
        suggestions.push(handleMissingGovernance(result, counter++));
        break;
      case "orphaned":
        suggestions.push(handleOrphaned(result, counter++));
        break;
    }
  }

  // Sort: confidence (high first), then action type
  suggestions.sort((a, b) => {
    const confDiff = CONFIDENCE_ORDER[a.confidence] - CONFIDENCE_ORDER[b.confidence];
    if (confDiff !== 0) return confDiff;
    return ACTION_ORDER[a.action] - ACTION_ORDER[b.action];
  });

  return suggestions;
}
