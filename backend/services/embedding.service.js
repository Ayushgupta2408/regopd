const { InferenceClient } = require("@huggingface/inference");

const hf = new InferenceClient(process.env.HF_API_KEY);

// "hf-inference" is HF's own serverless backend (one of several providers now
// routed through router.huggingface.co). It's the free-tier option and the
// direct successor to the old api-inference.huggingface.co endpoint.
const PROVIDER = process.env.HF_PROVIDER || "hf-inference";

/**
 * Gets embeddings for an array of text chunks using Hugging Face's
 * feature-extraction task via the InferenceClient (Inference Providers router).
 * Batches requests to stay within provider limits.
 */
async function embedTexts(texts) {
  const model = process.env.HF_EMBEDDING_MODEL;
  const batchSize = 16;
  const allEmbeddings = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const output = await hf.featureExtraction({
      model,
      provider: PROVIDER,
      inputs: batch,
    });

    // sentence-transformers models return one vector per input directly.
    // Some models return token-level embeddings (vector per token) instead,
    // which need mean pooling into a single sentence vector.
    const vectors = output.map((vec) => {
      if (Array.isArray(vec[0])) {
        const numTokens = vec.length;
        const dim = vec[0].length;
        const pooled = new Array(dim).fill(0);
        for (const token of vec) {
          for (let d = 0; d < dim; d++) pooled[d] += token[d];
        }
        return pooled.map((v) => v / numTokens);
      }
      return vec;
    });

    allEmbeddings.push(...vectors);
  }

  return allEmbeddings;
}

async function embedQuery(text) {
  const [vector] = await embedTexts([text]);
  return vector;
}

module.exports = { embedTexts, embedQuery };