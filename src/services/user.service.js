// src/services/user.service.js

const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const axios = require("axios");

exports.createUser = async (data) => {
  return await User.create(data);
};

exports.getAllUsers = async () => {
  return await User.find();
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.registerUser = async (data) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await User.create({
    ...data,
    password: hashedPassword
  });
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) throw new Error("User not found");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw new Error("Invalid credentials");

  return user;
};

exports.getUserBookings = async (userId) => {
  try {
    const response = await axios.get(
      `${process.env.BOOKING_SERVICE_URL}/api/bookings/user/${userId}`
    );
    return response.data;
  } catch (error) {
    throw new Error("Failed to fetch bookings");
  }
};