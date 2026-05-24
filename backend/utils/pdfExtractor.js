// backend/utils/pdfExtractor.js

import fs from "fs/promises";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const DEBUG = false;

const log = (...args) => {
  if (DEBUG) console.log(...args);
};

const MIN_TEXT = 10;
const MAX_OCR_PAGES = 5;
const MAX_TEXT_LENGTH = 50000;

const trimOutput = (text = "") =>
  text.trim().slice(0, MAX_TEXT_LENGTH);

async function extractUsingPdfParse(dataBuffer) {
  try {
    const pdfParse =
      require("pdf-parse/lib/pdf-parse.js");

    const result =
      await pdfParse(dataBuffer);

    return trimOutput(
      result.text
    );
  } catch {
    return "";
  }
}

async function loadPdfJS() {
  try {
    return await import(
      "pdfjs-dist/legacy/build/pdf.mjs"
    );
  } catch {
    return await import(
      "pdfjs-dist"
    );
  }
}

async function extractUsingPdfJS(
  dataBuffer
) {
  try {
    const pdfjs =
      await loadPdfJS();

    const pdf =
      await pdfjs
        .getDocument({
          data:
            new Uint8Array(
              dataBuffer
            ),
        })
        .promise;

    let text = "";

    for (
      let pageNum = 1;
      pageNum <=
      pdf.numPages;
      pageNum++
    ) {
      const page =
        await pdf.getPage(
          pageNum
        );

      const content =
        await page.getTextContent();

      text +=
        content.items
          .map(
            (i) =>
              i.str || ""
          )
          .join(
            " "
          ) + "\n";
    }

    return trimOutput(
      text
    );
  } catch {
    return "";
  }
}

async function extractUsingOCR(
  dataBuffer
) {
  try {
    const pdfjs =
      await loadPdfJS();

    const canvasLib =
      await import(
        "@napi-rs/canvas"
      );

    const tesseractModule =
      await import(
        "tesseract.js"
      );

    const Tesseract =
      tesseractModule.default ||
      tesseractModule;

    const pdf =
      await pdfjs
        .getDocument({
          data:
            new Uint8Array(
              dataBuffer
            ),
        })
        .promise;

    const pages =
      Math.min(
        pdf.numPages,
        MAX_OCR_PAGES
      );

    const worker =
      await Tesseract.createWorker(
        "eng"
      );

    let text = "";

    for (
      let i = 1;
      i <= pages;
      i++
    ) {
      const page =
        await pdf.getPage(
          i
        );

      const viewport =
        page.getViewport({
          scale: 2,
        });

      const canvas =
        canvasLib.createCanvas(
          viewport.width,
          viewport.height
        );

      const ctx =
        canvas.getContext(
          "2d"
        );

      await page.render({
        canvasContext:
          ctx,

        viewport,
      }).promise;

      const {
        data,
      } =
        await worker.recognize(
          canvas.toBuffer(
            "image/png"
          )
        );

      text +=
        data.text +
        "\n";
    }

    await worker.terminate();

    return trimOutput(
      text
    );
  } catch {
    return "";
  }
}

export async function extractTextFromPDF(
  filePath
) {
  const dataBuffer =
    await fs.readFile(
      filePath
    );

  log(
    "PDF size:",
    dataBuffer.length
  );

  let text =
    await extractUsingPdfParse(
      dataBuffer
    );

  if (
    text.length >
    MIN_TEXT
  ) {
    return text;
  }

  text =
    await extractUsingPdfJS(
      dataBuffer
    );

  if (
    text.length >
    MIN_TEXT
  ) {
    return text;
  }

  text =
    await extractUsingOCR(
      dataBuffer
    );

  return trimOutput(
    text
  );
}