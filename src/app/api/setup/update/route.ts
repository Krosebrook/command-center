import fs from "fs/promises";
import path from "path";
import { deepScanDrive } from "@/lib/deep-scanner";
import { KEY_FILES } from "@/lib/config";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { safeParseBody } from "@/lib/security";
import { logger } from "@/lib/logger";

interface ActionEntry {
  action: string;
  source: string;
  destination?: string;
}

export const POST = withErrorHandling(async (request: Request) => {
  const body = await safeParseBody<{ actions?: ActionEntry[] }>(request);
  const { actions } = body;

  // 1. Run fresh deep scan
  const scanData = await deepScanDrive();

  // 2. Update TODO.md with discovered issues
  const todoItems: string[] = [];
  for (const result of scanData.results) {
    if (result.type === "missing-index") {
      todoItems.push(`- [ ] Add _INDEX.md to \`${result.path}\``);
    }
    if (result.type === "unsorted") {
      todoItems.push(`- [ ] Sort or relocate \`${result.path}\``);
    }
  }

  if (todoItems.length > 0) {
    let todoContent = "";
    try {
      todoContent = await fs.readFile(KEY_FILES.todo, "utf-8");
    } catch {
      todoContent = "# TODO\n";
    }

    const sectionHeader = "## Discovered by Walkthrough";
    if (!todoContent.includes(sectionHeader)) {
      todoContent += `\n\n${sectionHeader}\n\n${todoItems.join("\n")}\n`;
    } else {
      const newItems = todoItems.filter(
        (item) => !todoContent.includes(item),
      );
      if (newItems.length > 0) {
        const sectionIndex = todoContent.indexOf(sectionHeader);
        const nextSectionIndex = todoContent.indexOf(
          "\n## ",
          sectionIndex + sectionHeader.length,
        );
        const insertPos =
          nextSectionIndex !== -1 ? nextSectionIndex : todoContent.length;
        const appendText = "\n" + newItems.join("\n");
        todoContent =
          todoContent.slice(0, insertPos) +
          appendText +
          todoContent.slice(insertPos);
      }
    await fs.mkdir(path.dirname(KEY_FILES.todo), { recursive: true });
    await fs.writeFile(KEY_FILES.todo, todoContent, "utf-8");
  }

  // 3. Update CHANGELOG.md
  const today = new Date().toISOString().split("T")[0];
  const changelogHeading = `## ${today} — Walkthrough Scan`;
  const actionCount = actions?.length ?? 0;
  const changelogEntry = `\n${changelogHeading}\n\nWalkthrough scan: found ${scanData.totalIssues} issues. Actions taken: ${actionCount}\n`;

  let changelogContent = "";
  try {
    changelogContent = await fs.readFile(KEY_FILES.changelog, "utf-8");
  } catch {
    changelogContent = "# CHANGELOG\n";
  }

  if (!changelogContent.includes(changelogHeading)) {
    const firstNewline = changelogContent.indexOf("\n");
    if (firstNewline !== -1) {
      changelogContent =
        changelogContent.slice(0, firstNewline + 1) +
        changelogEntry +
        changelogContent.slice(firstNewline + 1);
    } else {
      changelogContent += changelogEntry;
    }

    await fs.mkdir(path.dirname(KEY_FILES.changelog), { recursive: true });
    await fs.writeFile(KEY_FILES.changelog, changelogContent, "utf-8");
  }

  logger.info("Governance docs updated", {
    todoItems: todoItems.length,
    actionCount,
  });

  return jsonSuccess({
    success: true,
    updated: ["TODO.md", "CHANGELOG.md"],
  });
});
