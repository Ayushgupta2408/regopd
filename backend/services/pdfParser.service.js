const fs = require("fs");
const pdfParse = require("pdf-parse");

/**
 * Extracts raw text and page count from a PDF file on disk.
 */
async function parsePdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return {
    text: data.text,
    numPages: data.numpages,
  };
}

module.exports = { parsePdf };
