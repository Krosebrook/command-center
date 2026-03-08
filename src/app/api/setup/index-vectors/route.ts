import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { PROJECTS, FOLDERS } from "@/lib/config";
import { generateEmbedding } from "@/lib/embeddings";
import { saveVectorsToDb, clearProjectVectors, VectorRecord } from "@/lib/vector-store";
import { chunkCodeFile, SCAN_EXTENSIONS } from "@/lib/chunker";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

async function crawlDirectory(dir: string, project: any, newRecords: VectorRecord[], depth = 0) {
  if (depth > 5) return; // Prevent infinite loops or massive traversals

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') {
        continue; // Skip hidden, deps, build output
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await crawlDirectory(fullPath, project, newRecords, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        
        // Only process allowed extensions
        if (SCAN_EXTENSIONS.has(ext)) {
          try {
            const stats = await fs.stat(fullPath);
            const content = await fs.readFile(fullPath, "utf-8");
            
            // Skip massive files > 500kb
            if (stats.size > 500 * 1024) continue;

            // Chunk the file
            const chunks = chunkCodeFile(fullPath, content, 50, 10);
            
            for (const chunk of chunks) {
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
                // Ignore individual chunk failures (e.g., token limit exceeded)
              }
            }
          } catch (fileError) {
            // Ignore individual file read failures
          }
        }
      }
    }
  } catch (dirError) {
    // Ignore unreadable directories
  }
}

async function indexProjectsLogic(isDeep = false) {
  const newRecords: VectorRecord[] = [];
  
  // We'll index each project configured in config.ts
  for (const project of PROJECTS) {
    try {
      const stats = await fs.stat(project.path).catch(() => null);
      if (!stats) continue; // Project path doesn't exist

      // Always clear old vectors for this project before saving new ones
      clearProjectVectors(project.name);
      
      if (isDeep) {
        // Deep indexing: crawl the src directory (or root if no src)
        const srcPath = path.join(project.path, "src");
        const hasSrc = await fs.stat(srcPath).catch(() => null);
        const targetDir = hasSrc ? srcPath : project.path;
        
        await crawlDirectory(targetDir, project, newRecords);
      } else {
        // Shallow indexing: just read README.md / _INDEX.md
        let content = "";
        let lastModified = stats.mtime.toISOString();
        const indexFiles = ["_INDEX.md", "README.md"];
        for (const file of indexFiles) {
          try {
            const filePath = path.join(project.path, file);
            const fileStats = await fs.stat(filePath);
            content = await fs.readFile(filePath, "utf-8");
            lastModified = fileStats.mtime.toISOString();
            break; // Found a file, stop searching
          } catch (e) {
            // Ignore, check next file
          }
        }
        
        // We embed a combination of the project description, tech stack, and content
        const textToEmbed = `
Project Name: ${project.name}
Description: ${project.description}
Tech Stack: ${project.techStack.join(", ")}
Content:
${content ? content.slice(0, 500) : "No index file found."}
        `.trim();
        
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
      }

      
    } catch (error) {
      logger.warn(`Failed to index project: ${project.name}`, { error });
    }
  }
  
  // Save updated store batch to SQLite
  if (newRecords.length > 0) {
    saveVectorsToDb(newRecords);
  }
  
  return { indexedCount: newRecords.length };
}

export const POST = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  
  // Check if '?deep=true' is in the URL search params
  const url = new URL(request.url);
  const isDeep = url.searchParams.get("deep") === "true";
  
  logger.info(`Starting Semantic Local Search Indexing (Deep: ${isDeep})`);
  
  const result = await indexProjectsLogic(isDeep);
  
  logger.info(`Indexing complete in ${Date.now() - start}ms`, { count: result.indexedCount });
  return jsonSuccess(result, "Successfully indexed project vectors", 200, start);
});
