import { logger } from "./logger";
import { saveVectorsToDb, VectorRecord, clearFileVectors } from "./vector-store";
import { generateEmbedding } from "./embeddings";
import { chunkCodeFile } from "./chunker";
import fs from "fs/promises";
import { PROJECTS } from "./config";
import path from "path";

// We dynamically import chokidar to avoid blowing up the edge runtime if accidentally imported there
let chokidar: any = null;

const globalForWatcher = global as unknown as { activeWatcher: any | null };

export async function startWatcher() {
  if (globalForWatcher.activeWatcher) {
    return;
  }

  try {
    if (!chokidar) {
      chokidar = (await import("chokidar")).default;
    }
  } catch (e) {
    logger.error("Failed to load chokidar. Ensure it is installed in node_modules.");
    return;
  }

  logger.info("Initializing Live File System Watcher...");

  const watchedPaths = PROJECTS.map(p => p.path);

  const watcher = chokidar.watch(watchedPaths, {
    ignored: [
      /(^|[\/\\])\../, // ignore dotfiles
      /node_modules/,
      /\.git/,
      /dist/,
      /.next/,
    ],
    persistent: true,
    ignoreInitial: true,
  });

  globalForWatcher.activeWatcher = watcher;

  watcher
    .on("add", async (filePath: string) => {
      if (isValidCodeFile(filePath)) {
        logger.info(\`[Watcher] File added: \${filePath}\`);
        await reindexFile(filePath);
      }
    })
    .on("change", async (filePath: string) => {
      if (isValidCodeFile(filePath)) {
        logger.info(\`[Watcher] File changed: \${filePath}\`);
        await reindexFile(filePath);
      }
    })
    .on("unlink", async (filePath: string) => {
      if (isValidCodeFile(filePath)) {
        logger.info(\`[Watcher] File deleted: \${filePath}\`);
        await removeFileIndex(filePath);
      }
    })
    .on("error", (error: any) => logger.error(\`[Watcher] Error: \${error}\`));

  logger.info("Live File System Watcher is ACTIVE on " + watchedPaths.length + " project directories.");
}

export function getWatcherStatus() {
  if (globalForWatcher.activeWatcher) {
    const watched = globalForWatcher.activeWatcher.getWatched();
    return { status: "watching", watchedPaths: Object.keys(watched).length };
  }
  return { status: "idle", watchedPaths: 0 };
}

function isValidCodeFile(filePath: string) {
  const ext = path.extname(filePath);
  const validExtensions = [".ts", ".js", ".tsx", ".jsx", ".py", ".json", ".md", ".txt", ".html", ".css", ".sh"];
  return validExtensions.includes(ext);
}

function determineProjectForFile(filePath: string): any {
  for (const project of PROJECTS) {
    if (filePath.startsWith(project.path)) return project;
  }
  return null;
}

async function reindexFile(filePath: string) {
  try {
    const project = determineProjectForFile(filePath);
    if (!project) return;
    
    // Clear old vectors
    clearFileVectors(filePath);
    
    // Read and stat
    const stats = await fs.stat(filePath);
    if (stats.size > 500 * 1024) return; // Skip massive files
    
    const content = await fs.readFile(filePath, "utf-8");
    const chunks = chunkCodeFile(filePath, content, 50, 10);

    const records: VectorRecord[] = [];
    for (const chunk of chunks) {
      if (!chunk.content.trim()) continue;
      
      const textToEmbed = \`Project: \${project.name}\\nFile: \${chunk.filePath}\\nLines: \${chunk.startLine}-\${chunk.endLine}\\nCode:\\n\${chunk.content}\`;
      const embedding = await generateEmbedding(textToEmbed);
      
      records.push({
        id: chunk.id,
        text: textToEmbed,
        embedding: embedding,
        metadata: {
          title: project.name,
          description: \`Code chunk from \${path.basename(filePath)}\`,
          lastModified: stats.mtime.toISOString(),
          filePath: chunk.filePath,
        }
      });
    }

    if (records.length > 0) {
      saveVectorsToDb(records);
      logger.info(\`[Watcher] Re-indexed \${records.length} chunks for \${path.basename(filePath)}\`);
    } else {
       logger.info(\`[Watcher] Re-indexed \${path.basename(filePath)}, but it was empty.\`);
    }
  } catch (error: any) {
    logger.error(\`[Watcher] Failed to re-index \${filePath}\`, { error: error.message });
  }
}

async function removeFileIndex(filePath: string) {
  try {
    clearFileVectors(filePath);
    logger.info(\`[Watcher] Removed index for \${path.basename(filePath)}\`);
  } catch (error: any) {
    logger.error(\`[Watcher] Failed to remove index for \${filePath}\`, { error: error.message });
  }
}
