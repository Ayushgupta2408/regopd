const express = require("express");
const Pdf = require("../models/Pdf");
const Space = require("../models/Space");
const ChatMessage = require("../models/ChatMessage");
const { protect } = require("../middleware/auth");
const { embedQuery } = require("../services/embedding.service");
const { queryChunks } = require("../services/pinecone.service");
const { generateRagAnswer, SUPPORTED_MODELS } = require("../services/groq.service");

const router = express.Router();

router.get("/models", protect, (req, res) => {
  res.json({ models: SUPPORTED_MODELS });
});

router.get("/:pdfId/history", protect, async (req, res) => {
  const messages = await ChatMessage.find({ pdf: req.params.pdfId })
    .populate("user", "name")
    .sort({ createdAt: 1 });
  res.json({ messages });
});

// Ask a question about a PDF using RAG. If spaceCode is provided, the message
// is also broadcast to collaborators via Socket.io (see socket/socketHandler.js).
router.post("/:pdfId/ask", protect, async (req, res) => {
  try {
    const { question, model, spaceCode } = req.body;
    if (!question) return res.status(400).json({ message: "Question is required" });

    const pdfDoc = await Pdf.findById(req.params.pdfId);
    if (!pdfDoc) return res.status(404).json({ message: "PDF not found" });
    if (pdfDoc.status !== "ready") {
      return res.status(409).json({ message: `PDF is not ready yet (status: ${pdfDoc.status})` });
    }

    let space = null;
    if (spaceCode) {
      space = await Space.findOne({ code: spaceCode });
    }

    // Save user message
    const userMsg = await ChatMessage.create({
      pdf: pdfDoc._id,
      space: space?._id || null,
      user: req.user._id,
      role: "user",
      content: question,
    });

    // Retrieve relevant chunks
    const queryVector = await embedQuery(question);
    const topChunks = await queryChunks(pdfDoc.pineconeNamespace, queryVector, 5);

    // Recent conversation history for context (last 6 messages)
    const recentHistory = await ChatMessage.find({ pdf: pdfDoc._id })
      .sort({ createdAt: -1 })
      .limit(6);
    const history = recentHistory.reverse().map((m) => ({ role: m.role, content: m.content }));

    const answer = await generateRagAnswer({
      question,
      contextChunks: topChunks,
      model,
      history: history.slice(0, -1), // exclude the just-added user message
    });

    const assistantMsg = await ChatMessage.create({
      pdf: pdfDoc._id,
      space: space?._id || null,
      user: req.user._id,
      role: "assistant",
      content: answer,
      model: model || process.env.GROQ_DEFAULT_MODEL,
      sources: topChunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        text: c.text.slice(0, 300),
        score: c.score,
      })),
    });

    // Broadcast to space collaborators in real time, if applicable
    if (space) {
      const io = req.app.get("io");
      io?.to(space.code).emit("new_messages", {
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      });
    }

    res.json({ userMessage: userMsg, assistantMessage: assistantMsg });
  } catch (err) {
    console.error("Chat error:", err.message);
    res.status(500).json({ message: "Failed to generate answer", error: err.message });
  }
});

module.exports = router;
