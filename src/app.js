// src/app.js

const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./swagger/swagger.yaml");
const userRoutes = require("./routes/user.routes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.options(/.*/, cors());
app.use(express.json());
app.use((req, res, next) => {
  const startedAt = Date.now();
  const timestamp = new Date().toISOString();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${durationMs}ms`,
    );
  });

  next();
});
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("User Service is running...");
});

app.use(errorHandler);

module.exports = app;
