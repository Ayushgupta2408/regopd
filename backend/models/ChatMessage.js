const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    pdf: { type: mongoose.Schema.Types.ObjectId, ref: "Pdf", required: true },
    space: { type: mongoose.Schema.Types.ObjectId, ref: "Space", default: null },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
    model: { type: String, default: null },
    sources: [
      {
        chunkIndex: Number,
        text: String,
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

chatMessageSchema.index({ pdf: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);
