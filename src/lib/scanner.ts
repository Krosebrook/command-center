import fs from "fs/promises";
import path from "path";
import { DRIVE_ROOT } from "./config";

export interface FolderInfo {
  name: string;
  path: string;
  fileCount: number;
  totalSize: number;
  lastModified: Date;
  hasIndex: boolean;
}

export interface DriveStats {
  folders: FolderInfo[];
  totalFiles: number;
  totalSize: number;
  lastScan: Date;
}

let cachedStats: DriveStats | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getFolderStats(folderPath: string): Promise<FolderInfo> {
  const name = path.basename(folderPath);
  let fileCount = 0;
  let totalSize = 0;
  let lastModified = new Date(0);

  try {
    const entries = await fs.readdir(folderPath, { withFileTypes: true });
    for (const entry of entries) {
      try {
        const fullPath = path.join(folderPath, entry.name);
        const stat = await fs.stat(fullPath);
        if (stat.isFile()) {
          fileCount++;
          totalSize += stat.size;
        }
        if (stat.mtime > lastModified) {
          lastModified = stat.mtime;
        }
      } catch {
        // Skip inaccessible entries
      }
    }
  } catch {
    // Folder might not be readable
  }

  const hasIndex = await fs.access(path.join(folderPath, "_INDEX.md"))
    .then(() => true)
    .catch(() => false);

  return { name, path: folderPath, fileCount, totalSize, lastModified, hasIndex };
}

export async function scanDrive(): Promise<DriveStats> {
  const now = Date.now();
  if (cachedStats && now - cacheTime < CACHE_TTL) {
    return cachedStats;
  }

  const entries = await fs.readdir(DRIVE_ROOT, { withFileTypes: true });
  const numbered = entries.filter(
    (e) => e.isDirectory() && /^\d{2}_/.test(e.name)
  );

  const folders = await Promise.all(
    numbered.map((e) => getFolderStats(path.join(DRIVE_ROOT, e.name)))
  );

  const totalFiles = folders.reduce((sum, f) => sum + f.fileCount, 0);
  const totalSize = folders.reduce((sum, f) => sum + f.totalSize, 0);

  cachedStats = { folders, totalFiles, totalSize, lastScan: new Date() };
  cacheTime = now;
  return cachedStats;
}

export async function getSubfolders(dirPath: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter((e) => e.isDirectory() && !e.name.startsWith("."))
      .map((e) => e.name);
  } catch {
    return [];
  }
}

export async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile()) count++;
      else if (entry.isDirectory() && !entry.name.startsWith(".")) {
        count += await countFiles(path.join(dirPath, entry.name));
      }
    }
  } catch {
    // Skip inaccessible
  }
  return count;
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/** Invalidate the shallow scanner cache so the next call performs a fresh scan. */
export function clearCache(): void {
  cachedStats = null;
  cacheTime = 0;
}
