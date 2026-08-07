/**
 * Splits raw text into overlapping chunks suitable for embedding.
 * Uses a simple sliding window over words to keep chunks semantically coherent
 * while preserving context across boundaries via overlap.
 */
function chunkText(text, { chunkSize = 220, overlap = 40 } = {}) {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const words = cleaned.split(" ");
  const chunks = [];
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunk = words.slice(start, end).join(" ");
    chunks.push(chunk);
    if (end === words.length) break;
    start = end - overlap;
  }

  return chunks;
}

module.exports = chunkText;
