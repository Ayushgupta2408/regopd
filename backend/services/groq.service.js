const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Models exposed to the frontend's model selector.
const SUPPORTED_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "LLaMA 3.3 70B" },
  { id: "llama-3.1-8b-instant", label: "LLaMA 3.1 8B (fast)" },
  { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
  { id: "gemma2-9b-it", label: "Gemma 2 9B" },
];

/**
 * Generates a RAG answer grounded in retrieved PDF chunks.
 */
async function generateRagAnswer({ question, contextChunks, model, history = [] }) {
  const selectedModel = model || process.env.GROQ_DEFAULT_MODEL;

  const contextText = contextChunks
    .map((c, i) => `[Source ${i + 1}]\n${c.text}`)
    .join("\n\n");

  const systemPrompt = `You are a helpful assistant answering questions about a PDF document.
Use ONLY the provided context to answer. If the answer isn't in the context, say you don't know based on the document.
Cite sources inline like [Source 1] where relevant. Be concise and accurate.

Context:
${contextText}`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: question },
  ];

  const completion = await groq.chat.completions.create({
    model: selectedModel,
    messages,
    temperature: 0.3,
    max_tokens: 1024,
  });

  return completion.choices[0].message.content;
}

module.exports = { generateRagAnswer, SUPPORTED_MODELS };
