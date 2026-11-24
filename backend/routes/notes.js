const router = require("express").Router();
const Note = require("../models/Note");
const auth = require("../middleware/auth");
router.use(auth);

// Read all notes belonging to the signed-in user.
router.get("/", async (req, res) => {
  try { res.json(await Note.find({ user: req.userId }).sort({ pinned: -1, updatedAt: -1 })); }
  catch { res.status(500).json({ message: "Could not load notes" }); }
});
// Create a note.
router.post("/", async (req, res) => {
  try {
    const note = await Note.create({ user: req.userId, title: req.body.title || "Untitled note", content: req.body.content || "", color: req.body.color || "yellow" });
    res.status(201).json(note);
  } catch { res.status(400).json({ message: "Could not create note" }); }
});
// Update a note (only if it belongs to this user).
router.patch("/:id", async (req, res) => {
  try {
    const allowed = {};
    for (const key of ["title", "content", "color", "pinned"]) if (req.body[key] !== undefined) allowed[key] = req.body[key];
    const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.userId }, allowed, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json(note);
  } catch { res.status(400).json({ message: "Could not update note" }); }
});
// Delete a note.
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch { res.status(400).json({ message: "Could not delete note" }); }
});
module.exports = router;
