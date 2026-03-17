// server.js

const app = require("./src/app");
require("dotenv").config();
const connectDB = require("./src/config/db");

connectDB();

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
});