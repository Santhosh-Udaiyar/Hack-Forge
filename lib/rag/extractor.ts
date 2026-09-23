export interface ExtractedDocument {
  text: string;
  pages: Array<{ pageNumber: number; text: string }>;
  totalPages: number;
}

/**
 * Extracts plain text from raw string or PDF buffer
 */
export async function extractDocumentText(
  fileBuffer: Buffer | string,
  fileName: string
): Promise<ExtractedDocument> {
  if (typeof fileBuffer === "string") {
    return {
      text: fileBuffer,
      pages: [{ pageNumber: 1, text: fileBuffer }],
      totalPages: 1,
    };
  }

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  if (isPdf) {
    try {
      // Dynamic import of pdf-parse
      const pdfParse = require("pdf-parse");
      const data = await pdfParse(fileBuffer);
      return {
        text: data.text,
        pages: [{ pageNumber: 1, text: data.text }],
        totalPages: data.numpages || 1,
      };
    } catch (err) {
      console.warn("[HackForge Extractor] pdf-parse failed, falling back to string decode:", err);
      const decoded = fileBuffer.toString("utf-8");
      return {
        text: decoded,
        pages: [{ pageNumber: 1, text: decoded }],
        totalPages: 1,
      };
    }
  }

  const textContent = fileBuffer.toString("utf-8");
  return {
    text: textContent,
    pages: [{ pageNumber: 1, text: textContent }],
    totalPages: 1,
  };
}
