import fs from "fs/promises";
import path from "path";
import {
  DRIVE_ROOT,
  FOLDERS,
  STALE_DAYS,
  LARGE_FILE_THRESHOLD,
  GOVERNANCE_FILES,
} from "./config";
import { fileExists } from "./scanner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Cache (same pattern as scanner.ts)
// ---------------------------------------------------------------------------

let cachedResult: DeepScanResult | null = null;
let cacheTime = 0;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SYSTEM_ROOT_SKIP = new Set([
  "$RECYCLE.BIN",
  "System Volume Information",
  "pagefile.sys",
  "hiberfil.sys",
  ".claude",
  "tmp",
  "swapfile.sys",
  "DumpStack.log.tmp",
  "Recovery",
]);

async function readDirSafe(
  dirPath: string,
): Promise<import("fs").Dirent[]> {
  try {
    return await fs.readdir(dirPath, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * Recursively find the most recent mtime under `dirPath`, limited to `maxDepth`.
 */
async function mostRecentMtime(
  dirPath: string,
  maxDepth: number,
): Promise<Date> {
  let latest = new Date(0);
  if (maxDepth < 0) return latest;

  const entries = await readDirSafe(dirPath);
  for (const entry of entries) {
    try {
      const fullPath = path.join(dirPath, entry.name);
      const stat = await fs.stat(fullPath);
      if (stat.mtime > latest) latest = stat.mtime;
      if (entry.isDirectory()) {
        const sub = await mostRecentMtime(fullPath, maxDepth - 1);
        if (sub > latest) latest = sub;
      }
    } catch {
      // skip inaccessible
    }
  }
  return latest;
}

// ---------------------------------------------------------------------------
// Individual scan checks
// ---------------------------------------------------------------------------

/** Check numbered folders and their immediate subfolders for missing _INDEX.md */
async function checkMissingIndex(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const rootEntries = await readDirSafe(DRIVE_ROOT);
  const numbered = rootEntries.filter(
    (e) => e.isDirectory() && /^\d{2}_/.test(e.name),
  );

  await Promise.all(
    numbered.map(async (entry) => {
      const folderPath = path.join(DRIVE_ROOT, entry.name);
      const hasIdx = await fileExists(path.join(folderPath, "_INDEX.md"));
      if (!hasIdx) {
        results.push({
          type: "missing-index",
          path: folderPath,
          severity: "warning",
          details: `Numbered folder "${entry.name}" is missing _INDEX.md`,
        });
      }

      // Check immediate subfolders
      const subs = await readDirSafe(folderPath);
      await Promise.all(
        subs
          .filter((s) => s.isDirectory())
          .map(async (sub) => {
            const subPath = path.join(folderPath, sub.name);
            const subHasIdx = await fileExists(
              path.join(subPath, "_INDEX.md"),
            );
            if (!subHasIdx) {
              results.push({
                type: "missing-index",
                path: subPath,
                severity: "warning",
                details: `Subfolder "${entry.name}/${sub.name}" is missing _INDEX.md`,
              });
            }
          }),
      );
    }),
  );

  return results;
}

/** Items at D:\ root that aren't numbered folders and aren't system files */
async function checkOrphanedRootItems(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const entries = await readDirSafe(DRIVE_ROOT);

  for (const entry of entries) {
    if (SYSTEM_ROOT_SKIP.has(entry.name)) continue;
    if (/^\d{2}_/.test(entry.name)) continue;

    results.push({
      type: "orphaned",
      path: path.join(DRIVE_ROOT, entry.name),
      severity: "info",
      details: `Root item "${entry.name}" does not match numbered folder pattern`,
    });
  }

  return results;
}

/** Active projects whose most recent file modification is older than STALE_DAYS */
async function checkStaleProjects(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  const activeDir = path.join(
    FOLDERS.homebase,
    "03_Projects",
    "Projects",
    "Active",
  );
  const entries = await readDirSafe(activeDir);
  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  await Promise.all(
    entries
      .filter((e) => e.isDirectory())
      .map(async (entry) => {
        const projectPath = path.join(activeDir, entry.name);
        const latest = await mostRecentMtime(projectPath, 3);
        if (latest < cutoff) {
          results.push({
            type: "stale",
            path: projectPath,
            severity: "warning",
            details: `Project "${entry.name}" has had no modifications in ${STALE_DAYS}+ days`,
            lastModified: latest.toISOString(),
          });
        }
      }),
  );

  return results;
}

/** Files/folders sitting directly in inbox-style directories */
async function checkUnsortedItems(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  const unsortedDirs = [
    FOLDERS.downloads,
    FOLDERS.documentation,
    path.join(FOLDERS.backups, "NeedsSorting"),
  ];

  await Promise.all(
    unsortedDirs.map(async (dir) => {
      const entries = await readDirSafe(dir);
      for (const entry of entries) {
        // Skip hidden files/folders
        if (entry.name.startsWith(".")) continue;
        results.push({
          type: "unsorted",
          path: path.join(dir, entry.name),
          severity: "action",
          details: `Unsorted item "${entry.name}" in ${path.basename(dir)}`,
        });
      }
    }),
  );

  return results;
}

/** Walk numbered dirs and flag files > LARGE_FILE_THRESHOLD. Return top 20. */
async function checkLargeFiles(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  const rootEntries = await readDirSafe(DRIVE_ROOT);
  const numbered = rootEntries.filter(
    (e) => e.isDirectory() && /^\d{2}_/.test(e.name),
  );

  async function walk(dirPath: string, depth: number): Promise<void> {
    if (depth > 4) return; // limit recursion
    const entries = await readDirSafe(dirPath);
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stat = await fs.stat(fullPath);
        if (entry.isFile() && stat.size > LARGE_FILE_THRESHOLD) {
          results.push({
            type: "large-file",
            path: fullPath,
            severity: "info",
            details: `File is ${(stat.size / (1024 * 1024)).toFixed(1)} MB`,
            size: stat.size,
            lastModified: stat.mtime.toISOString(),
          });
        } else if (entry.isDirectory()) {
          await walk(fullPath, depth + 1);
        }
      } catch {
        // skip inaccessible
      }
    }
  }

  await Promise.all(
    numbered.map((e) => walk(path.join(DRIVE_ROOT, e.name), 0)),
  );

  // Keep only top 20 largest
  results.sort((a, b) => (b.size ?? 0) - (a.size ?? 0));
  return results.slice(0, 20);
}

/** Directories with zero children, checked 2 levels deep under numbered dirs */
async function checkEmptyDirectories(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  const rootEntries = await readDirSafe(DRIVE_ROOT);
  const numbered = rootEntries.filter(
    (e) => e.isDirectory() && /^\d{2}_/.test(e.name),
  );

  async function checkDir(dirPath: string, depth: number): Promise<void> {
    if (depth > 2) return;
    const entries = await readDirSafe(dirPath);
    if (entries.length === 0) {
      results.push({
        type: "empty-dir",
        path: dirPath,
        severity: "info",
        details: `Directory is empty`,
      });
      return;
    }
    await Promise.all(
      entries
        .filter((e) => e.isDirectory())
        .map((e) => checkDir(path.join(dirPath, e.name), depth + 1)),
    );
  }

  await Promise.all(
    numbered.map((e) => checkDir(path.join(DRIVE_ROOT, e.name), 0)),
  );

  return results;
}

/** Check that all GOVERNANCE_FILES exist */
async function checkMissingGovernance(): Promise<ScanResult[]> {
  const results: ScanResult[] = [];

  await Promise.all(
    GOVERNANCE_FILES.map(async (gf) => {
      const exists = await fileExists(gf.path);
      if (!exists) {
        results.push({
          type: "missing-governance",
          path: gf.path,
          severity: "action",
          details: `Governance file "${gf.label}" is missing`,
        });
      }
    }),
  );

  return results;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function deepScanDrive(): Promise<DeepScanResult> {
  const now = Date.now();
  if (cachedResult && now - cacheTime < CACHE_TTL) {
    return cachedResult;
  }

  const [
    missingIndex,
    orphaned,
    stale,
    unsorted,
    largeFiles,
    emptyDirs,
    missingGovernance,
  ] = await Promise.all([
    checkMissingIndex(),
    checkOrphanedRootItems(),
    checkStaleProjects(),
    checkUnsortedItems(),
    checkLargeFiles(),
    checkEmptyDirectories(),
    checkMissingGovernance(),
  ]);

  const results: ScanResult[] = [
    ...missingIndex,
    ...orphaned,
    ...stale,
    ...unsorted,
    ...largeFiles,
    ...emptyDirs,
    ...missingGovernance,
  ];

  const bySeverity = { info: 0, warning: 0, action: 0 };
  const byType: Record<ScanIssueType, number> = {
    "missing-index": 0,
    orphaned: 0,
    stale: 0,
    unsorted: 0,
    "large-file": 0,
    "empty-dir": 0,
    "missing-governance": 0,
  };

  for (const r of results) {
    bySeverity[r.severity]++;
    byType[r.type]++;
  }

  cachedResult = {
    results,
    scannedAt: new Date().toISOString(),
    totalIssues: results.length,
    bySeverity,
    byType,
  };
  cacheTime = now;

  return cachedResult;
}
