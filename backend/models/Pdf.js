const mongoose = require("mongoose");

const pdfSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    originalFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: { type: Number },
    numPages: { type: Number },
    numChunks: { type: Number, default: 0 },
    pineconeNamespace: { type: String, required: true, unique: true },
    collection: { type: mongoose.Schema.Types.ObjectId, ref: "Collection", default: null },
    spaceId: { type: String, default: null }, // shareable collaboration space code
    status: {
      type: String,
      enum: ["processing", "ready", "failed"],
      default: "processing",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pdf", pdfSchema);
