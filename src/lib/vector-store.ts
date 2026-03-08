import fs from 'fs/promises';
import path from 'path';

export interface VectorRecord {
  id: string; // Project path or identifier
  text: string; // The text that was embedded
  embedding: number[]; // The vector representation
  metadata: {
    title: string;
    description: string;
    lastModified: string;
  };
}

export interface VectorStore {
  records: VectorRecord[];
  lastIndexed: string | null;
}

const STORE_DIR = path.resolve('D:\\.command-center');
const STORE_PATH = path.join(STORE_DIR, 'vector-index.json');

export async function getVectorStore(): Promise<VectorStore> {
  try {
    const data = await fs.readFile(STORE_PATH, 'utf-8');
    return JSON.parse(data) as VectorStore;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      return { records: [], lastIndexed: null };
    }
    throw err;
  }
}

export async function saveVectorStore(store: VectorStore): Promise<void> {
  try {
    await fs.mkdir(STORE_DIR, { recursive: true });
  } catch (err: any) {
    if (err.code !== 'EEXIST') throw err;
  }
  await fs.writeFile(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
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
  const store = await getVectorStore();
  const scored = store.records.map(record => ({
    ...record,
    score: cosineSimilarity(queryEmbedding, record.embedding)
  }));
  
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
