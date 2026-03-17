// src/services/user.service.js

const User = require("../models/user.model");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { createHttpError } = require("../utils/httpError");

exports.createUser = async (data) => {
  return await User.create(data);
};

exports.getAllUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

exports.getUserById = async (id) => {
  return await User.findById(id);
};

exports.registerUser = async (data) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw createHttpError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await User.create({
    ...data,
    password: hashedPassword,
  });
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) throw createHttpError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw createHttpError(401, "Invalid credentials");

  return user;
};

exports.updateUser = async (id, updates) => {
  const payload = { ...updates };

  if (payload.email) {
    const existingUser = await User.findOne({
      email: payload.email,
      _id: { $ne: id },
    });

    if (existingUser) {
      throw createHttpError(409, "Email is already registered");
    }
  }

  if (payload.password) {
    payload.password = await bcrypt.hash(payload.password, 10);
  }

  const user = await User.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findByIdAndDelete(id);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  return user;
};

exports.getUserBookings = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  try {
    const response = await axios.get(
      `${process.env.BOOKING_SERVICE_URL}/api/bookings/user/${userId}`,
      {
        timeout: Number(process.env.BOOKING_SERVICE_TIMEOUT_MS || 5000),
      },
    );
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw createHttpError(502, "Failed to fetch bookings from Booking Service");
  }
};

exports.checkUserExists = async (id) => {
  const user = await User.findById(id).lean();

  return {
    exists: Boolean(user),
    user: user || null,
  };
};
