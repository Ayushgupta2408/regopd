const { getPineconeIndex } = require("../config/pinecone");

/**
 * Upserts chunk embeddings into Pinecone under a namespace unique to the PDF.
 */
async function upsertChunks(namespace, chunks, embeddings, pdfId) {
  const index = await getPineconeIndex();

  const vectors = chunks.map((chunk, i) => ({
    id: `${pdfId}-chunk-${i}`,
    values: embeddings[i],
    metadata: { text: chunk, chunkIndex: i, pdfId },
  }));

  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(namespace).upsert(batch);
  }
}

/**
 * Queries the top-K most relevant chunks for a given query embedding.
 */
async function queryChunks(namespace, queryVector, topK = 5) {
  const index = await getPineconeIndex();
  const result = await index.namespace(namespace).query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return (result.matches || []).map((match) => ({
    text: match.metadata?.text || "",
    chunkIndex: match.metadata?.chunkIndex,
    score: match.score,
  }));
}

async function deleteNamespace(namespace) {
  const index = await getPineconeIndex();
  await index.namespace(namespace).deleteAll();
}

module.exports = { upsertChunks, queryChunks, deleteNamespace };
