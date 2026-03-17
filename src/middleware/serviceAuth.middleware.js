module.exports = (req, res, next) => {
  const serviceToken = req.headers["x-service-token"];

  if (!process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(500).json({
      message: "INTERNAL_SERVICE_TOKEN is not configured",
    });
  }

  if (!serviceToken || serviceToken !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(401).json({ message: "Unauthorized service request" });
  }

  next();
};
