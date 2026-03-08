import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { assertUnderDriveRoot } from "@/lib/security";
import { logger } from "@/lib/logger";

const execAsync = promisify(exec);

export const POST = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  const body = await request.json();
  const { targetPath } = body;
  
  if (!targetPath) throw new Error("targetPath is required");
  
  // Security check to prevent arbitrary execution outside D:\
  assertUnderDriveRoot(targetPath);

  const stat = await fs.stat(targetPath);
  
  let command = "";
  let cwd = targetPath;

  if (stat.isDirectory()) {
    // Infer command from directory contents
    const files = await fs.readdir(targetPath);
    if (files.includes("package.json")) {
      command = "npm start";
    } else if (files.includes("index.js")) {
      command = "node index.js";
    } else if (files.includes("main.py")) {
      command = "python main.py";
    } else if (files.includes("index.ts")) {
      command = "npx tsx index.ts";
    } else {
      throw new Error("Cannot determine how to run this directory (missing package.json, index.js, main.py, etc).");
    }
  } else {
    // Run specific file
    cwd = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const file = path.basename(targetPath);
    
    if (ext === ".js") command = `node ${file}`;
    else if (ext === ".py") command = `python ${file}`;
    else if (ext === ".sh") command = `bash ${file}`;
    else if (ext === ".ts") command = `npx tsx ${file}`;
    else throw new Error(`Unsupported script type: ${ext}`);
  }

  logger.info(`Executing workflow: ${command} in ${cwd}`);

  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return jsonSuccess({ stdout, stderr, command }, "Execution complete", 200, start);
  } catch (error: any) {
    // child_process.exec throws an error object that contains stdout/stderr if the process exits with non-zero
    return jsonSuccess({ 
      stdout: error.stdout || "", 
      stderr: error.stderr || error.message,
      command,
      failed: true
    }, "Execution failed", 200, start); 
    // We return 200 so the frontend can still parse the JSON output of the user's failed script
  }
});
