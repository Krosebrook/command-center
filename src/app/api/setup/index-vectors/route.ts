import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { PROJECTS } from "@/lib/config";
import { generateEmbedding } from "@/lib/embeddings";
import { getVectorStore, saveVectorStore, VectorRecord } from "@/lib/vector-store";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

async function indexProjectsLogic() {
  const store = await getVectorStore();
  const newRecords: VectorRecord[] = [];
  
  // We'll index each project configured in config.ts
  for (const project of PROJECTS) {
    try {
      const stats = await fs.stat(project.path).catch(() => null);
      if (!stats) continue; // Project path doesn't exist
      
      // Try to read _INDEX.md or README.md
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
      
    } catch (error) {
      logger.warn(`Failed to index project: ${project.name}`, { error });
    }
  }
  
  // Save updated store
  store.records = newRecords;
  store.lastIndexed = new Date().toISOString();
  await saveVectorStore(store);
  
  return { indexedCount: newRecords.length };
}

export const POST = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  logger.info("Starting Semantic Local Search Indexing");
  const result = await indexProjectsLogic();
  logger.info(`Indexing complete in ${Date.now() - start}ms`, { count: result.indexedCount });
  return jsonSuccess(result, "Successfully indexed project vectors", 200, start);
});
