// src/controllers/user.controller.js

const userService = require("../services/user.service");
const { generateToken } = require("../utils/jwt");
const {
  validateRegistrationPayload,
  validateLoginPayload,
  validateUpdatePayload,
} = require("../utils/userValidation");
const { createHttpError } = require("../utils/httpError");

exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.register = async (req, res) => {
  try {
    const payload = validateRegistrationPayload(req.body);
    const user = await userService.registerUser(payload);
    res.status(201).json(user);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const payload = validateRegistrationPayload(req.body);
    const user = await userService.createAdminUser(payload);
    res.status(201).json(user);
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = validateLoginPayload(req.body);
    const user = await userService.loginUser(email, password);
    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await userService.getUserBookings(req.params.id);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);

    if (!user) {
      throw createHttpError(404, "User not found");
    }

    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const updates = validateUpdatePayload(req.body);
    const user = await userService.updateUser(req.params.id, updates);
    res.json(user);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

exports.checkUserExists = async (req, res) => {
  try {
    const result = await userService.checkUserExists(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};
