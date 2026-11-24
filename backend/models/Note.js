const mongoose = require("mongoose");
const noteSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, default: "Untitled note", trim: true },
  content: { type: String, default: "" },
  color: { type: String, default: "yellow" },
  pinned: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.model("Note", noteSchema);
