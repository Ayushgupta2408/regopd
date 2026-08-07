const express = require("express");
const { nanoid } = require("nanoid");
const Pdf = require("../models/Pdf");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { parsePdf } = require("../services/pdfParser.service");
const chunkText = require("../utils/chunkText");
const { embedTexts } = require("../services/embedding.service");
const { upsertChunks, deleteNamespace } = require("../services/pinecone.service");
const fs = require("fs");

const router = express.Router();

// Upload + ingest a PDF: parse -> chunk -> embed -> store in Pinecone
router.post("/upload", protect, upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No PDF file uploaded" });
  }

  const namespace = `pdf-${nanoid(12)}`;

  const pdfDoc = await Pdf.create({
    owner: req.user._id,
    title: req.body.title || req.file.originalname.replace(/\.pdf$/i, ""),
    originalFileName: req.file.originalname,
    filePath: req.file.path,
    fileSize: req.file.size,
    pineconeNamespace: namespace,
    collection: req.body.collectionId || null,
    status: "processing",
  });

  // Respond immediately, process ingestion in background
  res.status(202).json({ pdf: pdfDoc, message: "Upload received. Processing started." });

  try {
    const { text, numPages } = await parsePdf(req.file.path);
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("No extractable text found in PDF");
    }

    const embeddings = await embedTexts(chunks);
    await upsertChunks(namespace, chunks, embeddings, pdfDoc._id.toString());

    pdfDoc.numPages = numPages;
    pdfDoc.numChunks = chunks.length;
    pdfDoc.status = "ready";
    await pdfDoc.save();
  } catch (err) {
    console.error("PDF ingestion failed:", err.message);
    pdfDoc.status = "failed";
    await pdfDoc.save();
  }
});

// Poll ingestion status
router.get("/:id/status", protect, async (req, res) => {
  const pdfDoc = await Pdf.findOne({ _id: req.params.id, owner: req.user._id });
  if (!pdfDoc) return res.status(404).json({ message: "PDF not found" });
  res.json({ status: pdfDoc.status, numChunks: pdfDoc.numChunks, numPages: pdfDoc.numPages });
});

// List all PDFs owned by the user (optionally filtered by collection)
router.get("/", protect, async (req, res) => {
  const filter = { owner: req.user._id };
  if (req.query.collectionId) filter.collection = req.query.collectionId;

  const pdfs = await Pdf.find(filter).sort({ createdAt: -1 });
  res.json({ pdfs });
});

// Get single PDF metadata
router.get("/:id", protect, async (req, res) => {
  const pdfDoc = await Pdf.findOne({ _id: req.params.id, owner: req.user._id });
  if (!pdfDoc) return res.status(404).json({ message: "PDF not found" });
  res.json({ pdf: pdfDoc });
});

// Delete a PDF: removes file, Mongo record, and Pinecone vectors
router.delete("/:id", protect, async (req, res) => {
  const pdfDoc = await Pdf.findOne({ _id: req.params.id, owner: req.user._id });
  if (!pdfDoc) return res.status(404).json({ message: "PDF not found" });

  await deleteNamespace(pdfDoc.pineconeNamespace).catch(() => {});
  if (fs.existsSync(pdfDoc.filePath)) fs.unlinkSync(pdfDoc.filePath);
  await pdfDoc.deleteOne();

  res.json({ message: "PDF deleted" });
});

module.exports = router;
