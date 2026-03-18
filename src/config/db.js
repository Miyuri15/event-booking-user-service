// src/config/db.js

const mongoose = require("mongoose");
const { seedDefaultAdmin } = require("../services/user.service");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
    await seedDefaultAdmin();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
