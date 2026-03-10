import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { PROJECTS } from "@/lib/config";
import { generateEmbedding } from "@/lib/embeddings";
import { saveVectorsToDb, clearProjectVectors, VectorRecord } from "@/lib/vector-store";
import { SCAN_EXTENSIONS, chunkCodeFile } from "@/lib/chunker";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

async function processChunk(chunk: any, fullPath: string, project: any, stats: any, newRecords: VectorRecord[]) {
  const textToEmbed = `Project: ${project.name}\nFile: ${chunk.filePath}\nLines: ${chunk.startLine}-${chunk.endLine}\nCode:\n${chunk.content}`;
  try {
    const embedding = await generateEmbedding(textToEmbed);
    newRecords.push({
      id: chunk.id,
      text: textToEmbed,
      embedding,
      metadata: {
        title: project.name,
        description: `Code chunk from ${path.basename(fullPath)}`,
        lastModified: stats.mtime.toISOString(),
        filePath: chunk.filePath,
      }
    });
  } catch (embedError) {
    logger.debug(`Embed error for chunk ${chunk.id}:`, embedError);
  }
}

async function processFile(fullPath: string, project: any, newRecords: VectorRecord[]) {
  const ext = path.extname(fullPath).toLowerCase();
  
  if (!SCAN_EXTENSIONS.has(ext)) return;

  try {
    const stats = await fs.stat(fullPath);
    if (stats.size > 500 * 1024) return;

    const content = await fs.readFile(fullPath, "utf-8");
    const chunks = chunkCodeFile(fullPath, content, 50, 10);
    
    for (const chunk of chunks) {
      await processChunk(chunk, fullPath, project, stats, newRecords);
    }
  } catch (fileError) {
    logger.debug(`File reading error: ${fullPath}`, fileError);
  }
}

async function crawlDirectory(dir: string, project: any, newRecords: VectorRecord[], depth = 0) {
  if (depth > 5) return;

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await crawlDirectory(fullPath, project, newRecords, depth + 1);
      } else if (entry.isFile()) {
        await processFile(fullPath, project, newRecords);
      }
    }
  } catch (dirError) {
    logger.debug(`Dir read error: ${dir}`, dirError);
  }
}

async function indexDeep(project: any, newRecords: VectorRecord[]) {
  const srcPath = path.join(project.path, "src");
  const hasSrc = await fs.stat(srcPath).catch(() => null);
  const targetDir = hasSrc ? srcPath : project.path;
  
  await crawlDirectory(targetDir, project, newRecords);
}

async function indexShallow(project: any, stats: any, newRecords: VectorRecord[]) {
  let content = "";
  let lastModified = stats.mtime.toISOString();
  const indexFiles = ["_INDEX.md", "README.md"];
  
  for (const file of indexFiles) {
    try {
      const filePath = path.join(project.path, file);
      const fileStats = await fs.stat(filePath);
      content = await fs.readFile(filePath, "utf-8");
      lastModified = fileStats.mtime.toISOString();
      break;
    } catch (e) {
      logger.debug(`Index file not found or couldn't read: ${file}`, e);
    }
  }
  
  const textToEmbed = `
Project Name: ${project.name}
Description: ${project.description}
Tech Stack: ${project.techStack.join(", ")}
Content:
${content ? content.slice(0, 500) : "No index file found."}
  `.trim();
  
  try {
    const embedding = await generateEmbedding(textToEmbed);
    
    newRecords.push({
      id: project.path,
      text: textToEmbed,
      embedding,
      metadata: {
        title: project.name,
        description: project.description,
        lastModified
      }
    });
  } catch (err) {
    logger.debug(`Embedding error for shallow index of ${project.name}`, err);
  }
}

async function indexProjectsLogic(isDeep = false) {
  const newRecords: VectorRecord[] = [];
  
  for (const project of PROJECTS) {
    try {
      const stats = await fs.stat(project.path).catch(() => null);
      if (!stats) continue;

      clearProjectVectors(project.name);
      
      if (isDeep) {
        await indexDeep(project, newRecords);
      } else {
        await indexShallow(project, stats, newRecords);
      }
    } catch (error) {
      logger.warn(`Failed to index project: ${project.name}`, { error });
    }
  }
  
  if (newRecords.length > 0) {
    saveVectorsToDb(newRecords);
  }
  
  return { indexedCount: newRecords.length };
}

export const POST = async (request: Request): Promise<NextResponse> => {
  return _POST(request);
};

const _POST = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  
  const url = new URL(request.url);
  const isDeep = url.searchParams.get("deep") === "true";
  
  logger.info(`Starting Semantic Local Search Indexing (Deep: ${isDeep})`);
  
  const result = await indexProjectsLogic(isDeep);
  
  logger.info(`Indexing complete in ${Date.now() - start}ms`, { count: result.indexedCount });
  return jsonSuccess(result, "Successfully indexed project vectors", 200, start);
});

