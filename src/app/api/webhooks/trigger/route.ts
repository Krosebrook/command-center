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
  
  // 1. Authenticate Request
  const authHeader = request.headers.get("authorization");
  const providedSecret = authHeader?.replace("Bearer ", "") || (await request.clone().json().catch(() => ({}))).secret;
  
  const expectedSecret = process.env.WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    logger.error("WEBHOOK_SECRET is not configured on the server.");
    return new Response(JSON.stringify({ error: "Webhook system is not configured." }), { 
      status: 501, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  if (providedSecret !== expectedSecret) {
    logger.warn("Unauthorized webhook attempt");
    return new Response(JSON.stringify({ error: "Unauthorized" }), { 
      status: 401, 
      headers: { "Content-Type": "application/json" } 
    });
  }

  // 2. Parse Payload
  const body = await request.json();
  const { targetPath } = body;
  
  if (!targetPath) throw new Error("targetPath is required in the JSON payload");
  
  // Security check to prevent arbitrary execution outside configured drives
  assertUnderDriveRoot(targetPath);

  const stat = await fs.stat(targetPath);
  
  let command = "";
  let cwd = targetPath;

  if (stat.isDirectory()) {
    const files = await fs.readdir(targetPath);
    if (files.includes("package.json")) command = "npm start";
    else if (files.includes("index.js")) command = "node index.js";
    else if (files.includes("main.py")) command = "python main.py";
    else if (files.includes("index.ts")) command = "npx tsx index.ts";
    else throw new Error("Cannot determine how to run this directory.");
  } else {
    cwd = path.dirname(targetPath);
    const ext = path.extname(targetPath);
    const file = path.basename(targetPath);
    
    if (ext === ".js") command = \`node \${file}\`;
    else if (ext === ".py") command = \`python \${file}\`;
    else if (ext === ".sh") command = \`bash \${file}\`;
    else if (ext === ".ts") command = \`npx tsx \${file}\`;
    else throw new Error(\`Unsupported script type: \${ext}\`);
  }

  logger.info(\`Webhook triggered workflow: \${command} in \${cwd}\`);

  // 3. Queue Job
  const jobId = crypto.randomUUID();
  createJob(jobId, targetPath);

  // Kick off the script asynchronously
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
    updateJobStatus(jobId, finalStatus, \`\\n[Process exited with code \${code}]\`);
    logger.info(\`Webhook Job \${jobId} finished with code \${code}\`);
  });

  child.on('error', (err) => {
    updateJobStatus(jobId, 'failed', \`\\n[Execution Error: \${err.message}]\`);
    logger.error(\`Webhook Job \${jobId} failed to start\`, { error: err.message });
  });

  // Return HTTP 202 Accepted immediately
  return jsonSuccess({ 
    jobId, 
    message: "Webhook workflow queued successfully" 
  }, "Execution started", 202, start);
});
