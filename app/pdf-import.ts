"use client";

export type PDFPageText = { pageNumber: number; text: string; scanned: boolean; previewURL?: string };

export async function extractPDF(file: File): Promise<PDFPageText[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  const bytes = new Uint8Array(await file.arrayBuffer());
  const document = await pdfjs.getDocument({ data: bytes }).promise;
  const pages: PDFPageText[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber); const content = await page.getTextContent();
    const text = content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/gu, " ").trim();
    let previewURL: string | undefined;
    if (text.length < 20) {
      const viewport = page.getViewport({ scale: 1.2 }); const canvas = window.document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      const context = canvas.getContext("2d"); if (context) { await page.render({ canvas, canvasContext: context, viewport }).promise; previewURL = canvas.toDataURL("image/jpeg", 0.78); }
    }
    pages.push({ pageNumber, text, scanned: text.length < 20, previewURL });
  }
  return pages;
}
