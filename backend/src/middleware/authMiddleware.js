import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

/*
  protect middleware:
  - Reads token from Authorization header.
  - Verifies the token.
  - Finds the logged-in user.
  - Adds the user to req.user so controllers can use it.
*/
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

  if (!process.env.JWT_SECRET) {
    throw new ApiError("JWT_SECRET is not configured on the server.", 500);
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new ApiError(error.message || "Invalid token.", 401);
  }

  /*
    Corrected bug:
    Old generateToken used userId, but middleware used decoded.id.
    This now supports both userId and id, so older tokens are less likely to break.
  */
  const userId = decoded.userId || decoded.id;

  if (!userId) {
    throw new ApiError("Invalid token payload. User ID missing.", 401);
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new ApiError("User not found.", 401);
  }

  if (user.isActive === false) {
    throw new ApiError("This account is inactive.", 403);
  }

  req.user = user;
  next();
});

/*
  Admin-only middleware:
  - Allows only users with role = admin.
*/
export const admin = (req, res, next) => {
  if (!req.user || String(req.user.role).toLowerCase() !== "admin") {
    return next(new ApiError("Admin access only.", 403));
  }

  next();
};

export const adminOnly = admin;