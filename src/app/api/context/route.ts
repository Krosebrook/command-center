import fs from "fs/promises";
import path from "path";
import { KEY_FILES } from "@/lib/config";
import { assertUnderDriveRoot, safeParseBody } from "@/lib/security";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { ValidationError } from "@/lib/errors";
import { ContextRequestSchema } from "@/lib/validation";

const CONTEXT_FILES = ["CLAUDE.md", "AGENTS.md", "_INDEX.md", "README.md"];

async function collectContextFiles(
  projectPath: string,
): Promise<{ name: string; content: string }[]> {
  const collected: { name: string; content: string }[] = [];

  for (const filename of CONTEXT_FILES) {
    try {
      const content = await fs.readFile(
        path.join(projectPath, filename),
        "utf-8",
      );
      collected.push({ name: `project/${filename}`, content });
    } catch {
      // File doesn't exist in this project
    }
  }

  try {
    const claudeDir = path.join(projectPath, ".claude");
    const entries = await fs.readdir(claudeDir);
    for (const entry of entries) {
      if (entry.endsWith(".md") || entry.endsWith(".json")) {
        try {
          const content = await fs.readFile(
            path.join(claudeDir, entry),
            "utf-8",
          );
          collected.push({ name: `.claude/${entry}`, content });
        } catch {
          // Skip unreadable files
        }
      }
    }
  } catch {
    // .claude dir doesn't exist
  }

  try {
    const driveClaudeContent = await fs.readFile(KEY_FILES.claude, "utf-8");
    collected.push({ name: "drive/CLAUDE.md", content: driveClaudeContent });
  } catch {
    // Drive CLAUDE.md doesn't exist
  }

  return collected;
}

export const POST = withErrorHandling(async (request: Request) => {
  const rawBody = await safeParseBody(request);
  const parsed = ContextRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    throw new ValidationError("Invalid request", {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const { projectPath, projectName } = parsed.data;

  assertUnderDriveRoot(projectPath, "projectPath");

  const files = await collectContextFiles(projectPath);
  const context = files
    .map((f) => `# --- ${f.name} ---\n\n${f.content}`)
    .join("\n\n---\n\n");

  return jsonSuccess({
    projectName: projectName ?? path.basename(projectPath),
    context,
    files: files.map((f) => f.name),
  });
});
