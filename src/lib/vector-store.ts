import { getDb } from './db';
import { logger } from './logger';

export interface VectorRecord {
  id: string; // Project path or chunk identifier
  text: string; // The text that was embedded
  embedding: number[]; // The vector representation
  metadata: {
    title: string;
    description: string;
    lastModified?: string;
    filePath?: string;
  };
}

export function saveVectorsToDb(records: VectorRecord[]): void {
  const db = getDb();
  if (!db) return;

  try {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO project_embeddings (id, project_name, content, embedding, metadata)
      VALUES (@id, @project_name, @content, @embedding, @metadata)
    `);

    const insertMany = db.transaction((recordsToInsert: VectorRecord[]) => {
      for (const record of recordsToInsert) {
        insert.run({
          id: record.id,
          project_name: record.metadata.title,
          content: record.text,
          embedding: JSON.stringify(record.embedding),
          metadata: JSON.stringify(record.metadata),
        });
      }
    });

    insertMany(records);
  } catch (error) {
    logger.error("Failed to save vectors to SQLite", { error });
  }
}

export function clearProjectVectors(projectName: string): void {
  const db = getDb();
  if (!db) return;
  db.prepare(`DELETE FROM project_embeddings WHERE project_name = ?`).run(projectName);
}

export function clearFileVectors(filePath: string): void {
  const db = getDb();
  if (!db) return;
  try {
    // The JSON1 extension allows us to match the exact source file path
    db.prepare(`DELETE FROM project_embeddings WHERE json_extract(metadata, '$.filePath') = ?`).run(filePath);
  } catch (error) {
    logger.error("Failed to clear file vectors", { error });
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error('Vectors must be of identical length');
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function searchSimilar(queryEmbedding: number[], topK: number = 5): Promise<Array<VectorRecord & { score: number }>> {
  const db = getDb();
  if (!db) return [];

  // Note: For millions of vectors, doing this in-memory in Node would be slow.
  // But for thousands of code chunks, a simple SELECT * followed by JS math is nearly instant.
  const rows = db.prepare(`SELECT * FROM project_embeddings`).all();
  
  const scored = rows.map((row: any) => {
    const embedding = JSON.parse(row.embedding);
    return {
      id: row.id,
      text: row.content,
      embedding,
      metadata: JSON.parse(row.metadata),
      score: cosineSimilarity(queryEmbedding, embedding)
    };
  });
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
