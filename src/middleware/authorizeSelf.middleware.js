module.exports = (req, res, next) => {
  if (req.user.role === "ADMIN") {
    return next();
  }

  if (req.user.id !== req.params.id) {
    return res.status(403).json({
      message: "You are not authorized to access this user resource",
    });
  }

  next();
};
