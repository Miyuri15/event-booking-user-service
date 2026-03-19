// src/services/user.service.js

const { User, USER_ROLES } = require("../models/user.model");
const bcrypt = require("bcryptjs");
const axios = require("axios");
const { createHttpError } = require("../utils/httpError");

function getApiGatewayUrl() {
  if (!process.env.API_GATEWAY_URL) {
    throw createHttpError(500, "API_GATEWAY_URL is not configured");
  }

  return process.env.API_GATEWAY_URL.replace(/\/$/, "");
}

async function sendNotification(payload) {
  const serviceToken =
    process.env.INTERNAL_SERVICE_TOKEN || "shared_service_secret";
  const notificationPath =
    process.env.GATEWAY_NOTIFICATION_SEND_PATH || "/api/notifications/send";

  try {
    await axios.post(`${getApiGatewayUrl()}${notificationPath}`, payload, {
      headers: {
        "x-service-token": serviceToken,
      },
      timeout: Number(process.env.GATEWAY_TIMEOUT_MS || 5000),
    });
  } catch (error) {
    console.error(
      "Failed to send notification:",
      error.response?.status || error.code || "UNKNOWN",
      error.response?.data || error.message,
    );
  }
}

function mapRecipient(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

exports.createUser = async (data) => {
  return await User.create(data);
};

exports.getAllUsers = async () => {
  return await User.find().sort({ createdAt: -1 });
};

exports.getAdminUsers = async () => {
  return await User.find({ role: USER_ROLES.ADMIN }).sort({ createdAt: -1 });
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
  const user = await User.create({
    ...data,
    password: hashedPassword,
    role: USER_ROLES.USER,
  });

  await sendNotification({
    userId: user._id.toString(),
    type: "WELCOME",
    title: "Welcome to Luma Events",
    message: "Your account has been created successfully. Start exploring events now.",
    channel: "IN_APP",
    status: "UNREAD",
    metadata: {
      email: user.email,
    },
  });

  return user;
};

exports.createAdminUser = async (data) => {
  const existingUser = await User.findOne({ email: data.email });

  if (existingUser) {
    throw createHttpError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  return await User.create({
    ...data,
    password: hashedPassword,
    role: USER_ROLES.ADMIN,
  });
};

exports.updateAdminUser = async (id, updates) => {
  const admin = await User.findById(id);

  if (!admin) {
    throw createHttpError(404, "Admin user not found");
  }

  if (admin.role !== USER_ROLES.ADMIN) {
    throw createHttpError(400, "Target user is not an admin");
  }

  return await exports.updateUser(id, updates);
};

exports.deleteAdminUser = async (id) => {
  const admin = await User.findById(id);

  if (!admin) {
    throw createHttpError(404, "Admin user not found");
  }

  if (admin.role !== USER_ROLES.ADMIN) {
    throw createHttpError(400, "Target user is not an admin");
  }

  return await exports.deleteUser(id);
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) throw createHttpError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) throw createHttpError(401, "Invalid credentials");

  if (!user.role) {
    user.role = USER_ROLES.USER;
    await user.save();
  }

  await sendNotification({
    userId: user._id.toString(),
    type: "LOGIN_ALERT",
    title: "New login detected",
    message: "Your account was signed in successfully.",
    channel: "IN_APP",
    status: "UNREAD",
    metadata: {
      email: user.email,
      loginAt: new Date().toISOString(),
    },
  });

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

  await sendNotification({
    userId: user._id.toString(),
    type: "PROFILE_UPDATED",
    title: "Profile updated",
    message: "Your account details were updated successfully.",
    channel: "IN_APP",
    status: "UNREAD",
    metadata: {
      email: user.email,
    },
  });

  return user;
};

exports.deleteUser = async (id) => {
  const user = await User.findById(id);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  await sendNotification({
    userId: user._id.toString(),
    type: "ACCOUNT_DELETED",
    title: "Account deleted",
    message: "Your account has been deleted from the platform.",
    channel: "IN_APP",
    status: "UNREAD",
    metadata: {
      email: user.email,
      deletedAt: new Date().toISOString(),
    },
  });

  await User.findByIdAndDelete(id);

  return user;
};

exports.getUserBookings = async (userId, token) => {
  const user = await User.findById(userId);

  if (!user) {
    throw createHttpError(404, "User not found");
  }

  const bookingsPathTemplate =
    process.env.GATEWAY_USER_BOOKINGS_PATH || "/api/bookings/user/{userId}";
  const bookingsPath = bookingsPathTemplate.replace("{userId}", userId);

  try {
    const response = await axios.get(`${getApiGatewayUrl()}${bookingsPath}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: Number(process.env.GATEWAY_TIMEOUT_MS || 5000),
    });
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }

    throw createHttpError(502, "Failed to fetch bookings through API Gateway");
  }
};

exports.checkUserExists = async (id) => {
  const user = await User.findById(id).lean();

  return {
    exists: Boolean(user),
    user: user || null,
  };
};

exports.resolveNotificationRecipients = async ({ userIds = [], roles = [] } = {}) => {
  const normalizedUserIds = [...new Set((Array.isArray(userIds) ? userIds : [userIds]).filter(Boolean))];
  const normalizedRoles = [...new Set((Array.isArray(roles) ? roles : [roles]).filter(Boolean))];

  const recipientsById = new Map();

  if (normalizedUserIds.length) {
    const directUsers = await User.find({ _id: { $in: normalizedUserIds } });

    directUsers.forEach((user) => {
      recipientsById.set(user._id.toString(), mapRecipient(user));
    });
  }

  if (normalizedRoles.length) {
    const roleUsers = await User.find({ role: { $in: normalizedRoles } });

    roleUsers.forEach((user) => {
      recipientsById.set(user._id.toString(), mapRecipient(user));
    });
  }

  return {
    recipients: Array.from(recipientsById.values()),
    requestedUserIds: normalizedUserIds,
    requestedRoles: normalizedRoles,
  };
};

exports.seedDefaultAdmin = async () => {
  await User.updateMany(
    { role: { $exists: false } },
    { $set: { role: USER_ROLES.USER } },
  );

  const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "admin@eventbooking.com")
    .trim()
    .toLowerCase();
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const adminName = (process.env.DEFAULT_ADMIN_NAME || "System Admin").trim();

  const existingAdmin = await User.findOne({ email: adminEmail });

  if (existingAdmin) {
    if (existingAdmin.role !== USER_ROLES.ADMIN) {
      existingAdmin.role = USER_ROLES.ADMIN;
      await existingAdmin.save();
      console.log(`Default admin role restored for ${adminEmail}`);
    }

    return existingAdmin;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: USER_ROLES.ADMIN,
  });

  console.log(`Default admin created for ${adminEmail}`);

  return admin;
};
