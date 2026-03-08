import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/vector-store";
import { logger } from "@/lib/logger";

// Imports needed for tools
import { exec } from "child_process";
import crypto from "crypto";
import path from "path";
import fs from "fs/promises";
import { assertUnderDriveRoot } from "@/lib/security";
import { createJob, updateJobStatus, getJob } from "@/lib/db";

export const maxDuration = 60; // Allow enough time for LLM streaming and tasks

const TOOLS = [
  {
    type: "function",
    function: {
      name: "run_automation",
      description: "Executes a local script or directory automation in the background.",
      parameters: {
        type: "object",
        properties: {
          targetPath: {
            type: "string",
            description: "The absolute path to the script or directory on the D:\\ drive to execute."
          }
        },
        required: ["targetPath"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_job_status",
      description: "Gets the current status and terminal output of a background automation job.",
      parameters: {
        type: "object",
        properties: {
          jobId: {
            type: "string",
            description: "The ID of the job to check."
          }
        },
        required: ["jobId"]
      }
    }
  }
];

// Execute the requested tool locally
async function handleToolCall(name: string, argsStr: string) {
  try {
    const args = JSON.parse(argsStr);
    logger.info(\`Agent executing tool: \${name}\`, args);

    if (name === "run_automation") {
      const { targetPath } = args;
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

      const jobId = crypto.randomUUID();
      createJob(jobId, targetPath);

      const child = exec(command, { cwd });
      updateJobStatus(jobId, 'running');

      child.stdout?.on('data', (data) => updateJobStatus(jobId, 'running', data.toString()));
      child.stderr?.on('data', (data) => updateJobStatus(jobId, 'running', data.toString()));
      child.on('close', (code) => {
        updateJobStatus(jobId, code === 0 ? 'completed' : 'failed', \`\\n[Exited with code \${code}]\`);
      });
      child.on('error', (err) => {
        updateJobStatus(jobId, 'failed', \`\\n[Error: \${err.message}]\`);
      });

      return JSON.stringify({ success: true, jobId, message: "Job started in background" });
    }

    if (name === "get_job_status") {
      const { jobId } = args;
      const job = getJob(jobId);
      if (!job) return JSON.stringify({ error: "Job not found" });
      return JSON.stringify({ status: job.status, output: job.output?.slice(-2000) }); // Truncate out massive logs to save tokens
    }

    return JSON.stringify({ error: "Unknown tool" });
  } catch (err: any) {
    logger.error(\`Tool execution failed: \${name}\`, { error: err.message });
    return JSON.stringify({ error: err.message });
  }
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        "OpenAI API Key is missing. Please add OPENAI_API_KEY to your .env file to use the Chat feature.",
        { status: 401 }
      );
    }

    const latestMessage = messages[messages.length - 1].content;
    
    // 1. Generate embedding for the user's latest question for RAG context
    logger.info(\`RAG Search started for: "\${latestMessage.slice(0, 50)}..."\`);
    const queryEmbedding = await generateEmbedding(latestMessage);
    const results = await searchSimilar(queryEmbedding, 5);
    
    // 2. Construct the RAG augmented system prompt
    let systemContext = \`You are 'Antigravity Command Center', a senior developer autonomous agent managing my local machine.
You have direct access to snippets of my local source code.
You ALSO have access to tools that can execute scripts locally and monitor their status. Use them when requested to take action.
Always use local context to answer accurately. If the context doesn't contain the answer, say so.\\n\\n\`;

    if (results.length > 0) {
      systemContext += "LOCAL SOURCE CODE CONTEXT:\\n";
      results.forEach((r, i) => {
        const snippet = r.text.slice(0, 1500); 
        systemContext += \`--- Snippet \${i + 1} ---\\n\${snippet}\\n\`;
      });
    }

    const initialOpenAiMessages = [
      { role: "system", content: systemContext },
      ...messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
    ];

    // 3. We will consume the stream recursively to intercept tool calls without requiring the heavy \`openai\` SDK
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        async function runInteraction(currentMessages: any[]) {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": \`Bearer \${apiKey}\`,
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: currentMessages,
              tools: TOOLS,
              stream: true,
              temperature: 0.3, 
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ error: errText })}\\n\\n\`));
            controller.close();
            return;
          }

          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }

          const decoder = new TextDecoder("utf-8");
          let buffer = "";
          const activeToolCalls: Record<number, { id: string, name: string, args: string }> = {};

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\\n\\n');
            buffer = parts.pop() || '';

            for (const part of parts) {
              if (part.startsWith('data: ') && part !== 'data: [DONE]') {
                try {
                  const data = JSON.parse(part.slice(6));
                  const delta = data.choices[0]?.delta;
                  
                  if (delta?.content) {
                    // Forward text chunks to the client immediately
                    controller.enqueue(encoder.encode(\`data: \${JSON.stringify(data)}\\n\\n\`));
                  }

                  if (delta?.tool_calls) {
                    // Accumulate tool call chunks
                    for (const tc of delta.tool_calls) {
                      if (tc.id) {
                        activeToolCalls[tc.index] = { id: tc.id, name: tc.function.name, args: tc.function.arguments || "" };
                      } else if (tc.function?.arguments) {
                        activeToolCalls[tc.index].args += tc.function.arguments;
                      }
                    }
                  }
                } catch (e) {
                  // Ignore parse errors on split chunk boundaries
                }
              }
            }
          }

          const toolCallIndices = Object.keys(activeToolCalls);
          if (toolCallIndices.length > 0) {
            // Give UI feedback
            controller.enqueue(encoder.encode(\`data: \${JSON.stringify({ choices: [{ delta: { content: "\\n\\n*Executing internal tools...*\\n\\n" } }] })}\\n\\n\`));

            const assistantMessage: any = { role: "assistant", tool_calls: [] };
            const toolMessages: any[] = [];
            
            for (const idx of toolCallIndices) {
              const tc = activeToolCalls[parseInt(idx)];
              assistantMessage.tool_calls.push({ id: tc.id, type: "function", function: { name: tc.name, arguments: tc.args } });
              
              // Run the local script/API
              const result = await handleToolCall(tc.name, tc.args);
              toolMessages.push({ role: "tool", tool_call_id: tc.id, name: tc.name, content: result });
            }

            // Loop back and let the AI process the tool result
            await runInteraction([...currentMessages, assistantMessage, ...toolMessages]);
          } else {
            // Stream complete
            controller.enqueue(encoder.encode('data: [DONE]\\n\\n'));
            controller.close();
          }
        }

        await runInteraction(initialOpenAiMessages);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    logger.error("Chat API error", { error: error.message });
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
