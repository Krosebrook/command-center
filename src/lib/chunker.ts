/**
 * A lightweight, zero-dependency code chunking utility.
 * In a production system, you'd use Tree-Sitter for semantic AST boundaries.
 * Here, we use a line-based sliding window approach with overlap to prevent
 * cutting context in the middle of crucial functions.
 */

export interface Chunk {
  id: string; // usually filename#chunk-index
  filePath: string;
  content: string;
  startLine: number;
  endLine: number;
}

export function chunkCodeFile(filePath: string, fileContent: string, maxLines: number = 50, overlap: number = 10): Chunk[] {
  const lines = fileContent.split('\n');
  const chunks: Chunk[] = [];
  
  if (lines.length === 0 || !fileContent.trim()) {
    return chunks;
  }

  let currentStart = 0;

  while (currentStart < lines.length) {
    // Determine the end line for this chunk
    let currentEnd = Math.min(currentStart + maxLines, lines.length);
    
    // Extract the lines for this chunk
    const chunkLines = lines.slice(currentStart, currentEnd);
    const chunkContent = chunkLines.join('\n').trim();
    
    if (chunkContent.length > 0) {
      chunks.push({
        id: \`\${filePath}#L\${currentStart + 1}-\${currentEnd}\`,
        filePath,
        content: chunkContent,
        startLine: currentStart + 1,
        endLine: currentEnd
      });
    }

    // Move start forward, minding the overlap
    // If we've reached the end, break out
    if (currentEnd >= lines.length) {
      break;
    }
    
    currentStart = currentEnd - overlap;
  }

  return chunks;
}

// Allowed extensions for deep scanning
export const SCAN_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", 
  ".py", ".md", ".json", ".yaml", 
  ".yml", ".sql", ".css", ".html"
]);
