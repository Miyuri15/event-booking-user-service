// src/routes/user.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");

// PUBLIC
router.post("/register", controller.register);
router.post("/login", controller.login);

// PROTECTED
router.get("/", auth, controller.getAllUsers);
router.get("/:id/bookings", auth, controller.getUserBookings);
router.get("/:id", auth, controller.getUser);

module.exports = router;