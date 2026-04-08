// packages/ui/src/utils/pdf-extract.js
// PDF.js text extraction helper. Loads PDF.js from CDN if not already present.

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PAGES = 50;
const MAX_BYTES = 500 * 1024; // 500 KB

let pdfJsLoadPromise = null;

function loadPdfJs() {
  if (pdfJsLoadPromise) return pdfJsLoadPromise;
  pdfJsLoadPromise = new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const script = document.createElement('script');
    script.src = PDFJS_CDN;
    script.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    script.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(script);
  });
  return pdfJsLoadPromise;
}

/**
 * Extract text from a PDF File/Blob.
 * @param {File} file
 * @returns {Promise<string>}
 */
export async function extractTextFromPdf(file) {
  const pdfjs = await loadPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageCount = Math.min(pdf.numPages, MAX_PAGES);

  let text = '';
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => item.str).join(' ');
    text += pageText + '\n';
    if (new Blob([text]).size > MAX_BYTES) break;
  }

  // Truncate to 500KB
  if (new Blob([text]).size > MAX_BYTES) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text).slice(0, MAX_BYTES);
    text = new TextDecoder().decode(bytes);
  }

  return text.trim();
}
