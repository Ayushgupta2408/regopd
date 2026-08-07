const mongoose = require("mongoose");

const spaceSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // shareable code, e.g. "sp_ab12cd"
    pdf: { type: mongoose.Schema.Types.ObjectId, ref: "Pdf", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Space", spaceSchema);
