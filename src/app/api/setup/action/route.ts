import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { DRIVE_ROOT, WALKTHROUGH_LOG_PATH } from "@/lib/config";
import { fileExists, clearCache } from "@/lib/scanner";
import { clearDeepCache } from "@/lib/deep-scanner";
import type { WalkthroughLogEntry } from "@/lib/types";

const LOG_PATH = WALKTHROUGH_LOG_PATH;

const VALID_ACTIONS = ["move", "create-index", "archive", "delete"] as const;
type ActionType = (typeof VALID_ACTIONS)[number];

/**
 * Return true only if the resolved path stays within DRIVE_ROOT.
 * Prevents path-traversal attacks (e.g. "../../../etc/passwd" or "C:\Windows").
 */
function isUnderDriveRoot(inputPath: string): boolean {
  const normalized = path.normalize(inputPath);
  const root = path.normalize(DRIVE_ROOT);
  // DRIVE_ROOT ends with a separator (e.g. "D:\"), so prefix check is safe.
  return normalized === root || normalized.startsWith(root);
}

async function appendToLog(entry: WalkthroughLogEntry) {
  let log: WalkthroughLogEntry[] = [];
  try {
    const existing = await fs.readFile(LOG_PATH, "utf-8");
    log = JSON.parse(existing);
  } catch {
    // File doesn't exist yet or is invalid — start fresh
  }
  log.push(entry);
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log, null, 2), "utf-8");
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, source, destination } = body as {
    action: string;
    source: string;
    destination?: string;
  };

  if (!action || !source) {
    return NextResponse.json(
      { error: "action and source are required" },
      { status: 400 }
    );
  }

  if (!VALID_ACTIONS.includes(action as ActionType)) {
    return NextResponse.json(
      { error: `Invalid action type: ${action}. Valid actions: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  // Security: reject paths that escape the drive root
  if (!isUnderDriveRoot(source)) {
    return NextResponse.json(
      { error: "source path is outside the allowed drive root" },
      { status: 400 }
    );
  }
  if (destination && !isUnderDriveRoot(destination)) {
    return NextResponse.json(
      { error: "destination path is outside the allowed drive root" },
      { status: 400 }
    );
  }

  if (!(await fileExists(source))) {
    return NextResponse.json(
      { error: `Source does not exist: ${source}` },
      { status: 404 }
    );
  }

  try {
    switch (action as ActionType) {
      case "move": {
        if (!destination) {
          return NextResponse.json(
            { error: "destination is required for move action" },
            { status: 400 }
          );
        }
        await fs.mkdir(destination, { recursive: true });
        const targetPath = path.join(destination, path.basename(source));
        await fs.rename(source, targetPath);
        await appendToLog({ action, source, destination, timestamp: new Date().toISOString() });
        clearCache();
        clearDeepCache();
        return NextResponse.json({
          success: true,
          message: `Moved ${path.basename(source)} to ${destination}`,
        });
      }

      case "create-index": {
        const entries = await fs.readdir(source, { withFileTypes: true });
        const folderName = path.basename(source);
        const date = new Date().toISOString().split("T")[0];
        const lines = [
          `# ${folderName}`,
          "",
          `> Auto-generated index — ${date}`,
          "",
        ];
        for (const entry of entries) {
          const icon = entry.isDirectory() ? "\u{1F4C1}" : "\u{1F4C4}";
          lines.push(`- ${icon} ${entry.name}`);
        }
        lines.push("");
        const indexPath = path.join(source, "_INDEX.md");
        await fs.writeFile(indexPath, lines.join("\n"), "utf-8");
        await appendToLog({ action, source, timestamp: new Date().toISOString() });
        clearDeepCache();
        return NextResponse.json({
          success: true,
          message: `Created _INDEX.md in ${folderName} with ${entries.length} entries`,
        });
      }

      case "archive": {
        // Validate that the source lives inside an "Active" directory (exact segment match)
        if (!/[/\\]Active[/\\]/.test(source)) {
          return NextResponse.json(
            { error: "archive action requires source to be inside an Active directory" },
            { status: 400 }
          );
        }
        const archiveBase = source.replace(
          /[/\\]Active[/\\]/,
          `${path.sep}Archive${path.sep}`
        );
        const datePrefix = new Date().toISOString().split("T")[0];
        const archiveName = `${datePrefix}_${path.basename(source)}`;
        const archiveDir = path.dirname(archiveBase);
        const archivePath = path.join(archiveDir, archiveName);
        await fs.mkdir(archiveDir, { recursive: true });
        await fs.rename(source, archivePath);
        await appendToLog({
          action,
          source,
          destination: archivePath,
          timestamp: new Date().toISOString(),
        });
        clearCache();
        clearDeepCache();
        return NextResponse.json({
          success: true,
          message: `Archived ${path.basename(source)} to ${archivePath}`,
        });
      }

      case "delete": {
        await fs.rm(source, { recursive: true });
        await appendToLog({ action, source, timestamp: new Date().toISOString() });
        clearCache();
        clearDeepCache();
        return NextResponse.json({
          success: true,
          message: `Deleted ${source}`,
        });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: `Action "${action}" failed`, details: String(error) },
      { status: 500 }
    );
  }
}
