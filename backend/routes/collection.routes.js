const express = require("express");
const Collection = require("../models/Collection");
const Pdf = require("../models/Pdf");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Collection name is required" });

  const collection = await Collection.create({ owner: req.user._id, name, description });
  res.status(201).json({ collection });
});

router.get("/", protect, async (req, res) => {
  const collections = await Collection.find({ owner: req.user._id }).sort({ createdAt: -1 });

  // attach pdf counts
  const withCounts = await Promise.all(
    collections.map(async (c) => {
      const count = await Pdf.countDocuments({ collection: c._id });
      return { ...c.toObject(), pdfCount: count };
    })
  );

  res.json({ collections: withCounts });
});

router.get("/:id", protect, async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) return res.status(404).json({ message: "Collection not found" });

  const pdfs = await Pdf.find({ collection: collection._id }).sort({ createdAt: -1 });
  res.json({ collection, pdfs });
});

router.put("/:id", protect, async (req, res) => {
  const collection = await Collection.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id },
    { $set: req.body },
    { new: true }
  );
  if (!collection) return res.status(404).json({ message: "Collection not found" });
  res.json({ collection });
});

router.delete("/:id", protect, async (req, res) => {
  const collection = await Collection.findOne({ _id: req.params.id, owner: req.user._id });
  if (!collection) return res.status(404).json({ message: "Collection not found" });

  await Pdf.updateMany({ collection: collection._id }, { $set: { collection: null } });
  await collection.deleteOne();

  res.json({ message: "Collection deleted" });
});

module.exports = router;
