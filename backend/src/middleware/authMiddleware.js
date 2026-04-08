import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const protect = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError("Not authorized. No token provided.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new ApiError("User not found or token is invalid.", 401);
  }

  req.user = user;
  next();
});

export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return next(new ApiError("Access denied. Admin only.", 403));
  }

  next();
};