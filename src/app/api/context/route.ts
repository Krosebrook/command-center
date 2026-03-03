import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { KEY_FILES } from "@/lib/config";

const CONTEXT_FILES = ["CLAUDE.md", "AGENTS.md", "_INDEX.md", "README.md"];

async function collectContextFiles(
  projectPath: string
): Promise<{ name: string; content: string }[]> {
  const collected: { name: string; content: string }[] = [];

  // Project-level context files
  for (const filename of CONTEXT_FILES) {
    try {
      const content = await fs.readFile(
        path.join(projectPath, filename),
        "utf-8"
      );
      collected.push({ name: `project/${filename}`, content });
    } catch {
      // File doesn't exist in this project
    }
  }

  // Also check .claude directory
  try {
    const claudeDir = path.join(projectPath, ".claude");
    const entries = await fs.readdir(claudeDir);
    for (const entry of entries) {
      if (entry.endsWith(".md") || entry.endsWith(".json")) {
        try {
          const content = await fs.readFile(
            path.join(claudeDir, entry),
            "utf-8"
          );
          collected.push({ name: `.claude/${entry}`, content });
        } catch {}
      }
    }
  } catch {}

  // Drive-level context
  try {
    const driveClaudeContent = await fs.readFile(KEY_FILES.claude, "utf-8");
    collected.push({ name: "drive/CLAUDE.md", content: driveClaudeContent });
  } catch {}

  return collected;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { projectPath, projectName } = body;

  if (!projectPath || typeof projectPath !== "string") {
    return NextResponse.json(
      { error: "projectPath is required" },
      { status: 400 }
    );
  }

  const files = await collectContextFiles(projectPath);
  const context = files
    .map(
      (f) =>
        `# --- ${f.name} ---\n\n${f.content}`
    )
    .join("\n\n---\n\n");

  return NextResponse.json({
    projectName: projectName ?? path.basename(projectPath),
    context,
    files: files.map((f) => f.name),
  });
}
