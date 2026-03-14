// backend/utils/pdfExtractor.js

import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// Set to true only when debugging PDF issues
const DEBUG = false;
const log = (...args) => { if (DEBUG) console.log(...args); };

export async function extractTextFromPDF(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  log(`[PDF Extractor] File size: ${dataBuffer.length} bytes`);

  let text = "";

  // Method 1: pdf-parse
  try {
    const pdfParse = require("pdf-parse/lib/pdf-parse.js");

    const options = {
      pagerender: function (pageData) {
        return pageData.getTextContent().then(function (textContent) {
          let lastY = null;
          let pageText = "";

          for (const item of textContent.items) {
            if (item.str === undefined) continue;

            if (lastY !== null && Math.abs(lastY - item.transform[5]) > 2) {
              pageText += "\n";
            }
            pageText += item.str + " ";
            lastY = item.transform[5];
          }

          return pageText;
        });
      },
    };

    const result = await pdfParse(dataBuffer, options);
    text = result.text || "";

    log(`[PDF Extractor] Method 1 (pdf-parse): ${text.trim().length} chars`);

    if (text.trim().length > 10) {
      log(`[PDF Extractor] ✅ Text extracted via pdf-parse`);
      return text.trim();
    }
  } catch (err) {
    log(`[PDF Extractor] Method 1 failed: ${err.message}`);
  }

  // Method 2: pdfjs-dist
  let pdfjsLib = null;

  try {
    try {
      pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    } catch {
      pdfjsLib = await import("pdfjs-dist");
    }

    const data = new Uint8Array(dataBuffer);
    const pdf = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    log(`[PDF Extractor] Method 2: ${pdf.numPages} pages found`);

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      let lastY = null;
      let lineText = "";

      for (const item of textContent.items) {
        if (item.str === undefined) continue;

        if (lastY !== null && Math.abs(lastY - item.transform[5]) > 2) {
          fullText += lineText.trim() + "\n";
          lineText = "";
        }
        lineText += item.str + " ";
        lastY = item.transform[5];
      }

      fullText += lineText.trim() + "\n\n";
    }

    text = fullText;
    log(`[PDF Extractor] Method 2 (pdfjs-dist): ${text.trim().length} chars`);

    if (text.trim().length > 10) {
      log(`[PDF Extractor] ✅ Text extracted via pdfjs-dist`);
      return text.trim();
    }
  } catch (err) {
    log(`[PDF Extractor] Method 2 failed: ${err.message}`);
  }

  // Method 3: OCR
  log(`[PDF Extractor] ⚠️ Minimal text found. Starting OCR...`);

  try {
    const napiCanvas = await import("@napi-rs/canvas");
    const TesseractModule = await import("tesseract.js");
    const Tesseract = TesseractModule.default || TesseractModule;

    if (!pdfjsLib) {
      try {
        pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
      } catch {
        pdfjsLib = await import("pdfjs-dist");
      }
    }

    const data = new Uint8Array(dataBuffer);
    const pdf = await pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      disableFontFace: true,
    }).promise;

    const totalPages = pdf.numPages;
    const maxPages = Math.min(totalPages, 15);

    log(`[PDF Extractor] OCR: Processing ${maxPages}/${totalPages} pages...`);

    const worker = await Tesseract.createWorker("eng", 1);

    let ocrText = "";

    for (let i = 1; i <= maxPages; i++) {
      log(`[PDF Extractor] OCR: Page ${i}/${maxPages}...`);

      const page = await pdf.getPage(i);
      const scale = 2.0;
      const viewport = page.getViewport({ scale });

      const width = Math.floor(viewport.width);
      const height = Math.floor(viewport.height);

      const canvas = napiCanvas.createCanvas(width, height);
      const context = canvas.getContext("2d");

      context.fillStyle = "white";
      context.fillRect(0, 0, width, height);

      const canvasFactory = {
        create(w, h) {
          const c = napiCanvas.createCanvas(w, h);
          return { canvas: c, context: c.getContext("2d") };
        },
        reset(canvasPair, w, h) {
          canvasPair.canvas.width = w;
          canvasPair.canvas.height = h;
        },
        destroy(canvasPair) {
          canvasPair.canvas = null;
          canvasPair.context = null;
        },
      };

      await page.render({
        canvasContext: context,
        viewport,
        canvasFactory,
      }).promise;

      const pngBuffer = canvas.toBuffer("image/png");

      const {
        data: { text: pageText },
      } = await worker.recognize(pngBuffer);

      if (pageText && pageText.trim()) {
        ocrText += `--- Page ${i} ---\n${pageText.trim()}\n\n`;
      }
    }

    await worker.terminate();

    text = ocrText;

    log(`[PDF Extractor] ✅ OCR complete: ${text.trim().length} chars`);

    if (totalPages > maxPages) {
      text += `\n\n[Note: OCR processed ${maxPages} of ${totalPages} pages.]`;
    }

    if (text.trim().length > 10) {
      return text.trim();
    }
  } catch (err) {
    log(`[PDF Extractor] ❌ OCR failed: ${err.message}`);
  }

  return text.trim();
}