require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN?.split(",") || true }));
app.use(express.json({ limit: "1mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "notepad-api" }));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/notes", require("./routes/notes"));
const PORT = process.env.PORT || 8080;
connectDB().then(() => app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`)))
  .catch(err => { console.error("Database connection failed:", err.message); process.exit(1); });
