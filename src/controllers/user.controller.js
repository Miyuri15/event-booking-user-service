// src/controllers/user.controller.js

const userService = require("../services/user.service");
const { generateToken } = require("../utils/jwt");


exports.createUser = async (req, res) => {
  try {
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  const users = await userService.getAllUsers();
  res.json(users);
};

exports.getUser = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REGISTER
exports.register = async (req, res) => {
  try {
    const user = await userService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (typeof password !== "string") {
      return res.status(400).json({ message: "Password must be a string" });
    }

    const user = await userService.loginUser(email, password);

    const token = generateToken(user);

    res.json({ token });
  } catch (err) {
    res.status(401).json({ message: err.message });
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