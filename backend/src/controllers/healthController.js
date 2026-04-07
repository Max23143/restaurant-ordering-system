const getHealthStatus = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Restaurant Ordering API is running.",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString()
  });
};

export { getHealthStatus };