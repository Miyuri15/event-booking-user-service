const { createHttpError } = require("./httpError");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeUserPayload = (payload = {}) => ({
  name: typeof payload.name === "string" ? payload.name.trim() : payload.name,
  email:
    typeof payload.email === "string"
      ? payload.email.trim().toLowerCase()
      : payload.email,
  password: payload.password,
});

exports.validateRegistrationPayload = (payload = {}) => {
  const normalized = normalizeUserPayload(payload);

  if (!normalized.name || normalized.name.length < 2) {
    throw createHttpError(400, "Name must be at least 2 characters long");
  }

  if (!normalized.email || !emailRegex.test(normalized.email)) {
    throw createHttpError(400, "A valid email address is required");
  }

  if (typeof normalized.password !== "string" || normalized.password.length < 6) {
    throw createHttpError(400, "Password must be at least 6 characters long");
  }

  return normalized;
};

exports.validateLoginPayload = (payload = {}) => {
  const normalized = normalizeUserPayload(payload);

  if (!normalized.email || !emailRegex.test(normalized.email)) {
    throw createHttpError(400, "A valid email address is required");
  }

  if (typeof normalized.password !== "string" || !normalized.password.trim()) {
    throw createHttpError(400, "Password is required");
  }

  return {
    email: normalized.email,
    password: normalized.password,
  };
};

exports.validateUpdatePayload = (payload = {}) => {
  const normalized = normalizeUserPayload(payload);
  const updates = {};

  if (normalized.name !== undefined) {
    if (!normalized.name || normalized.name.length < 2) {
      throw createHttpError(400, "Name must be at least 2 characters long");
    }
    updates.name = normalized.name;
  }

  if (normalized.email !== undefined) {
    if (!normalized.email || !emailRegex.test(normalized.email)) {
      throw createHttpError(400, "A valid email address is required");
    }
    updates.email = normalized.email;
  }

  if (payload.password !== undefined) {
    if (typeof payload.password !== "string" || payload.password.length < 6) {
      throw createHttpError(400, "Password must be at least 6 characters long");
    }
    updates.password = payload.password;
  }

  if (Object.keys(updates).length === 0) {
    throw createHttpError(400, "Provide at least one field to update");
  }

  return updates;
};
