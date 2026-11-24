import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { pathToFileURL } from "node:url";
import path from "node:path";

// pdf.js (used internally by pdf-parse) loads its worker script via a relative
// dynamic import that Turbopack doesn't resolve correctly in the Next.js server
// bundle ("Cannot find module '.../pdf.worker.mjs'"). Pointing it at the real
// on-disk file bypasses that bundling issue entirely.
PDFParse.setWorker(
  pathToFileURL(path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs")).href,
);

const PDF = "application/pdf";
const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const TXT = "text/plain";

/**
 * Browsers don't reliably report `file.type` for every OS/file-association
 * combination (it can come back empty or generic, especially for .docx on
 * some Windows setups) — fall back to the file extension when that happens.
 */
export function resolveCvMimeType(reportedType: string, fileName: string): string | null {
  if (reportedType === PDF || reportedType === DOCX || reportedType === TXT) return reportedType;

  const ext = fileName.toLowerCase().split(".").pop();
  if (ext === "pdf") return PDF;
  if (ext === "docx") return DOCX;
  if (ext === "txt") return TXT;
  return null;
}

export async function extractCvText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === PDF) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  if (mimeType === DOCX) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mimeType === TXT) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
