const mongoose = require("mongoose");
async function connectDB() {
  await mongoose.connect(process.env.MONGOURI);
  console.log("MongoDB connected");
}
module.exports = connectDB;
