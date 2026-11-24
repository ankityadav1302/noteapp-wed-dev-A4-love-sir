const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6)
      return res.status(400).json({ message: "Name, email and a password of at least 6 characters are required." });
    const normalizedEmail = email.toLowerCase().trim();
    if (await User.findOne({ email: normalizedEmail }))
      return res.status(409).json({ message: "An account with this email already exists." });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ message: "Account created", user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) { res.status(500).json({ message: "Could not create account" }); }
});
router.post("/login", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email?.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || "", user.password)))
      return res.status(401).json({ message: "Email or password is incorrect." });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "Signed in", token, user: { id: user._id, name: user.name, email: user.email } });
  } catch { res.status(500).json({ message: "Could not sign in" }); }
});
module.exports = router;
