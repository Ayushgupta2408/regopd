const { Pinecone } = require("@pinecone-database/pinecone");

let pineconeClient = null;
let indexRef = null;

const getPineconeIndex = async () => {
  if (indexRef) return indexRef;

  pineconeClient = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

  const indexName = process.env.PINECONE_INDEX;
  const existing = await pineconeClient.listIndexes();
  const found = existing.indexes?.some((idx) => idx.name === indexName);

  if (!found) {
    await pineconeClient.createIndex({
      name: indexName,
      dimension: Number(process.env.PINECONE_DIMENSION || 384),
      metric: "cosine",
      spec: { serverless: { cloud: "aws", region: "us-east-1" } },
    });
  }

  indexRef = pineconeClient.index(indexName);
  return indexRef;
};

module.exports = { getPineconeIndex };
