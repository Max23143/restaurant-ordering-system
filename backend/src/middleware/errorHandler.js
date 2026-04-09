const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || res.statusCode;

  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  if (err.code === 11000) {
    statusCode = 400;
    err.message = "A user with this email already exists.";
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
};

export default errorHandler;