import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { WALKTHROUGH_LOG_PATH } from "@/lib/config";
import { fileExists, clearCache } from "@/lib/scanner";
import { clearDeepCache } from "@/lib/deep-scanner";
import { assertUnderDriveRoot, safeParseBody } from "@/lib/security";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { ValidationError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { ActionRequestSchema } from "@/lib/validation";
import type { WalkthroughLogEntry } from "@/lib/types";

const LOG_PATH = WALKTHROUGH_LOG_PATH;

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

export const POST = withErrorHandling(async (request: Request) => {
  const rawBody = await safeParseBody(request);
  const parsed = ActionRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Invalid request", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { action, source, destination } = parsed.data;

  assertUnderDriveRoot(source, "source");
  if (destination) assertUnderDriveRoot(destination, "destination");

  if (action !== "create-file" && !(await fileExists(source))) {
    throw new NotFoundError("Source", source);
  }

  try {
    switch (action) {
      case "move": {
        if (!destination) {
          throw new ValidationError("destination is required for move action");
        }
        await fs.mkdir(destination, { recursive: true });
        const targetPath = path.join(destination, path.basename(source));
        await fs.rename(source, targetPath);
        await appendToLog({ action, source, destination, timestamp: new Date().toISOString() });
        clearCache();
        clearDeepCache();
        logger.info("File moved", { source, destination: targetPath });
        return jsonSuccess({
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
        logger.info("Index created", { path: indexPath, entries: entries.length });
        return jsonSuccess({
          success: true,
          message: `Created _INDEX.md in ${folderName} with ${entries.length} entries`,
        });
      }

      case "create-file": {
        const folderPath = path.dirname(source);
        const fileName = path.basename(source);
        await fs.mkdir(folderPath, { recursive: true });
        
        let content = `# ${fileName}\n\n`;
        if (fileName === "TODO.md") content += "## Pending Items\n";
        else if (fileName === "CHANGELOG.md") content += "## Initialization\n- Created file\n";

        await fs.writeFile(source, content, "utf-8");
        await appendToLog({ action, source, timestamp: new Date().toISOString() });
        clearDeepCache();
        logger.info("Governance file created", { path: source });
        return jsonSuccess({
          success: true,
          message: `Created ${fileName}`,
        });
      }

      case "archive": {
        if (!/[/\\]Active[/\\]/.test(source)) {
          throw new ValidationError(
            "archive action requires source to be inside an Active directory",
          );
        }
        const archiveBase = source.replace(
          /[/\\]Active[/\\]/,
          `${path.sep}Archive${path.sep}`,
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
        logger.info("Project archived", { source, destination: archivePath });
        return jsonSuccess({
          success: true,
          message: `Archived ${path.basename(source)} to ${archivePath}`,
        });
      }

      case "delete": {
        logger.warn("Delete action executed", { source });
        await fs.rm(source, { recursive: true });
        await appendToLog({ action, source, timestamp: new Date().toISOString() });
        clearCache();
        clearDeepCache();
        return jsonSuccess({
          success: true,
          message: `Deleted ${source}`,
        });
      }
    }

    // TypeScript exhaustiveness — shouldn't reach here
    throw new ValidationError(`Unhandled action: ${action}`);
  } catch (error) {
    throw error; // Let withErrorHandling handle it
  }
});
