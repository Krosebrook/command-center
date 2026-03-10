import { NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { searchSimilar } from "@/lib/vector-store";
import { withErrorHandling, jsonSuccess } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

export const POST = async (request: Request): Promise<NextResponse> => {
  return _POST(request);
};

const _POST = withErrorHandling(async (request: Request) => {
  const start = Date.now();
  const body = await request.json();
  
  if (!body.query || typeof body.query !== "string") {
    return NextResponse.json({ error: "Search query is required and must be a string." }, { status: 400 });
  }

  logger.info(`Semantic search starting for query: "${body.query}"`);
  
  // Convert query to embedding
  const queryEmbedding = await generateEmbedding(body.query);
  
  // Search vector store
  // We'll return the top 5 matches
  const results = await searchSimilar(queryEmbedding, 5);
  
  logger.info(`Search complete in ${Date.now() - start}ms`, { resultsCount: results.length });
  return jsonSuccess({ results });
});
