import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  let token = "";

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError("Not authorized, no token provided.", 401);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(error.message || "Invalid token.", 401);
  }

  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    throw new ApiError("User not found.", 401);
  }

  req.user = user;
  next();
});

export const admin = (req, res, next) => {
  if (!req.user || String(req.user.role).toLowerCase() !== "admin") {
    return next(new ApiError("Admin access only.", 403));
  }

  next();
};

export const adminOnly = admin;