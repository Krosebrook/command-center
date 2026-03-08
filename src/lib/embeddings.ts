import { pipeline, env } from '@xenova/transformers';

// Suppress local model download warnings/logs if needed, configure cache dict
env.localModelPath = 'D:\\.command-center\\models';
env.allowRemoteModels = true; // allow downloading the first time

let extractor: any = null;

/**
 * Get or initialize the feature extractor pipeline for embeddings
 */
export async function getExtractor() {
  if (!extractor) {
    // all-MiniLM-L6-v2 is a lightweight, fast, English sentence transformer model
    // producing 384-dimensional embeddings (approx 22MB)
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractor;
}

/**
 * Generate an embedding for a piece of text
 * @param text The input string to embed
 * @returns A number array representing the embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const ex = await getExtractor();
  
  // Clean whitespace from text
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  if (!cleanText) {
    throw new Error("Text for embedding cannot be empty");
  }

  // Generate embedding: output is a tensor
  const output = await ex(cleanText, { pooling: 'mean', normalize: true });
  
  // Convert the Float32Array to a standard JavaScript array
  return Array.from(output.data);
}
