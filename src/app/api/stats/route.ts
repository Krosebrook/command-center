import { NextResponse } from "next/server";
import { scanDrive } from "@/lib/scanner";
import { readFileContent, parseTodoItems } from "@/lib/parser";
import { KEY_FILES } from "@/lib/config";

export async function GET() {
  const [driveStats, todoContent] = await Promise.all([
    scanDrive(),
    readFileContent(KEY_FILES.todo),
  ]);

  const todos = parseTodoItems(todoContent);

  return NextResponse.json({
    drive: {
      folderCount: driveStats.folders.length,
      totalFiles: driveStats.totalFiles,
      totalSize: driveStats.totalSize,
      lastScan: driveStats.lastScan,
    },
    tasks: {
      total: todos.length,
      completed: todos.filter((t) => t.done).length,
      pending: todos.filter((t) => !t.done).length,
    },
    folders: driveStats.folders.map((f) => ({
      name: f.name,
      fileCount: f.fileCount,
      totalSize: f.totalSize,
      lastModified: f.lastModified,
      hasIndex: f.hasIndex,
    })),
  });
}
