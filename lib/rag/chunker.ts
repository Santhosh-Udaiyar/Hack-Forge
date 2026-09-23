import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export interface TextChunk {
  content: string;
  charStart: number;
  charEnd: number;
  pageNumber?: number;
}

/**
 * Splits document text into semantically cohesive chunks using RecursiveCharacterTextSplitter
 * Handles markdown headings, numbered rule lists, and tables cleanly.
 */
export async function splitDocumentIntoChunks(
  fullText: string,
  options: { chunkSize?: number; chunkOverlap?: number; pageNumber?: number } = {}
): Promise<TextChunk[]> {
  const { chunkSize = 600, chunkOverlap = 100, pageNumber = 1 } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators: [
      "\n## ",
      "\n### ",
      "\nRULE ",
      "\nSECTION ",
      "\n\n",
      "\n",
      ". ",
      "? ",
      "! ",
      " ",
      "",
    ],
  });

  const rawChunks = await splitter.splitText(fullText);
  const chunks: TextChunk[] = [];
  let currentSearchOffset = 0;

  for (const chunkContent of rawChunks) {
    const trimmed = chunkContent.trim();
    if (!trimmed) continue;

    // Find character position in original full text
    const startIndex = fullText.indexOf(trimmed, currentSearchOffset);
    const start = startIndex !== -1 ? startIndex : currentSearchOffset;
    const end = start + trimmed.length;
    currentSearchOffset = Math.max(0, start + trimmed.length - chunkOverlap);

    chunks.push({
      content: trimmed,
      charStart: start,
      charEnd: end,
      pageNumber,
    });
  }

  return chunks;
}
