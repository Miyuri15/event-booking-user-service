// src/routes/user.routes.js

const express = require("express");
const router = express.Router();
const controller = require("../controllers/user.controller");
const auth = require("../middleware/auth.middleware");
const authorizeSelf = require("../middleware/authorizeSelf.middleware");
const authorizeRole = require("../middleware/authorizeRole.middleware");
const serviceAuth = require("../middleware/serviceAuth.middleware");

// PUBLIC
router.post("/register", controller.register);
router.post("/login", controller.login);

// INTERNAL SERVICE-TO-SERVICE
router.get("/internal/:id/exists", serviceAuth, controller.checkUserExists);

// PROTECTED
router.post("/admins", auth, authorizeRole("ADMIN"), controller.createAdmin);
router.get("/admins", auth, authorizeRole("ADMIN"), controller.getAdmins);
router.put("/admins/:id", auth, authorizeRole("ADMIN"), controller.updateAdmin);
router.delete("/admins/:id", auth, authorizeRole("ADMIN"), controller.deleteAdmin);
router.get("/", auth, authorizeRole("ADMIN"), controller.getAllUsers);
router.get("/me", auth, controller.getCurrentUser);
router.get("/:id/bookings", auth, authorizeSelf, controller.getUserBookings);
router.get("/:id", auth, authorizeSelf, controller.getUser);
router.put("/:id", auth, authorizeSelf, controller.updateUser);
router.delete("/:id", auth, authorizeSelf, controller.deleteUser);

module.exports = router;
