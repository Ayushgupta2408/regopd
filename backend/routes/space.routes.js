const express = require("express");
const { nanoid } = require("nanoid");
const Space = require("../models/Space");
const Pdf = require("../models/Pdf");
const ChatMessage = require("../models/ChatMessage");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Create a shareable space from an owned PDF
router.post("/", protect, async (req, res) => {
  const { pdfId } = req.body;
  const pdfDoc = await Pdf.findOne({ _id: pdfId, owner: req.user._id });
  if (!pdfDoc) return res.status(404).json({ message: "PDF not found" });

  const code = `sp_${nanoid(8)}`;
  const space = await Space.create({
    code,
    pdf: pdfDoc._id,
    createdBy: req.user._id,
    members: [req.user._id],
  });

  pdfDoc.spaceId = code;
  await pdfDoc.save();

  res.status(201).json({ space });
});

// Join an existing space by its shareable code
router.post("/:code/join", protect, async (req, res) => {
  const space = await Space.findOne({ code: req.params.code });
  if (!space) return res.status(404).json({ message: "Space not found" });

  if (!space.members.includes(req.user._id)) {
    space.members.push(req.user._id);
    await space.save();
  }

  const pdfDoc = await Pdf.findById(space.pdf);
  res.json({ space, pdf: pdfDoc });
});

// Get space details + chat history
router.get("/:code", protect, async (req, res) => {
  const space = await Space.findOne({ code: req.params.code }).populate("members", "name email");
  if (!space) return res.status(404).json({ message: "Space not found" });

  const pdfDoc = await Pdf.findById(space.pdf);
  const messages = await ChatMessage.find({ space: space._id })
    .populate("user", "name")
    .sort({ createdAt: 1 });

  res.json({ space, pdf: pdfDoc, messages });
});

module.exports = router;
