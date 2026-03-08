import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { assertUnderDriveRoot } from "@/lib/security";
import { logger } from "@/lib/logger";
import { createJob, updateJobStatus } from "@/lib/db";

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

  logger.info(\`Queuing workflow: \${command} in \${cwd}\`);

  // Generate a unique Job ID
  const jobId = crypto.randomUUID();
  createJob(jobId, targetPath);

  // Kick off the script asynchronously. Do not \`await\` it.
  const child = exec(command, { cwd });
  updateJobStatus(jobId, 'running');

  child.stdout?.on('data', (data) => {
    updateJobStatus(jobId, 'running', data.toString());
  });

  child.stderr?.on('data', (data) => {
    updateJobStatus(jobId, 'running', data.toString());
  });

  child.on('close', (code) => {
    const finalStatus = code === 0 ? 'completed' : 'failed';
    updateJobStatus(jobId, finalStatus, \`\n[Process exited with code \${code}]\`);
    logger.info(\`Job \${jobId} finished with code \${code}\`);
  });

  child.on('error', (err) => {
    updateJobStatus(jobId, 'failed', \`\n[Execution Error: \${err.message}]\`);
    logger.error(\`Job \${jobId} failed to start\`, { error: err.message });
  });

  // Return immediately to the client with the tracking ID
  return jsonSuccess({ 
    jobId, 
    message: "Workflow queued successfully" 
  }, "Execution started", 202, start);
});
