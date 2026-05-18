import crypto from "crypto";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import generateToken from "../utils/generateToken.js";

/*
  Strong password rule:
  The same rule is used for registration and password reset.
*/
const strongPasswordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

export const registerUser = catchAsync(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    throw new ApiError("Full name, email, password, and phone are required.", 400);
  }

  if (!strongPasswordPattern.test(password)) {
    throw new ApiError(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      400
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const normalizedPhone = String(phone).trim();

  const existingUser = await User.findOne({
    $or: [{ email: normalizedEmail }, { phone: normalizedPhone }]
  });

  if (existingUser) {
    throw new ApiError("User already exists with this email or phone number.", 400);
  }

  const user = await User.create({
    fullName: String(fullName).trim(),
    email: normalizedEmail,
    password,
    phone: normalizedPhone
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token: generateToken(user._id),
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});

export const loginUser = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError("Email and password are required.", 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  /*
    User.js has password select:false.
    So we must manually select password for login comparison.
  */
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError("Invalid email or password.", 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new ApiError("Invalid email or password.", 401);
  }

  res.status(200).json({
    success: true,
    message: "Login successful",
    token: generateToken(user._id),
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  });
});

export const getMyProfile = catchAsync(async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      isActive: req.user.isActive
    }
  });
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const { fullName, phone } = req.body;

  const updates = {};

  if (fullName && String(fullName).trim()) {
    updates.fullName = String(fullName).trim();
  }

  if (phone && String(phone).trim()) {
    const normalizedPhone = String(phone).trim();

    const existingPhoneUser = await User.findOne({
      phone: normalizedPhone,
      _id: { $ne: req.user._id }
    });

    if (existingPhoneUser) {
      throw new ApiError("This phone number is already in use.", 400);
    }

    updates.phone = normalizedPhone;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: "Profile updated successfully.",
    user: {
      id: updatedUser._id,
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      phone: updatedUser.phone,
      role: updatedUser.role,
      isActive: updatedUser.isActive
    }
  });
});

export const changeMyPassword = catchAsync(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError("Current password and new password are required.", 400);
  }

  if (!strongPasswordPattern.test(newPassword)) {
    throw new ApiError(
      "New password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      400
    );
  }

  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    throw new ApiError("User not found.", 404);
  }

  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw new ApiError("Current password is incorrect.", 401);
  }

  /*
    User.js pre-save middleware will hash the password automatically.
  */
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully."
  });
});

export const deleteMyAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;

  /*
    Related customer data is deleted when the account is deleted.
  */
  await Order.deleteMany({ user: userId });
  await Booking.deleteMany({ user: userId });
  await Review.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: "Your account and related data have been deleted successfully."
  });
});

export const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError("Email is required.", 400);
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError("No account found with this email.", 404);
  }

  /*
    Demo PIN reset system:
    - No email is sent.
    - No phone/SMS is sent.
    - Backend creates a 6-digit reset PIN.
    - Backend stores ONLY hashed PIN in MongoDB.
    - Frontend receives resetPin and shows it in alert.
  */
  const resetPin = String(Math.floor(100000 + Math.random() * 900000));

  const hashedPin = crypto
    .createHash("sha256")
    .update(resetPin)
    .digest("hex");

  user.resetPasswordToken = hashedPin;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  /*
    Important:
    Frontend is expecting response.resetPin.
    So this response MUST include resetPin.
  */
  res.status(200).json({
    success: true,
    message: "Reset PIN generated successfully. It expires in 15 minutes.",
    resetPin,
    email: user.email
  });
});

export const resetPassword = catchAsync(async (req, res) => {
  const { email, pin, password } = req.body;

  if (!email || !pin || !password) {
    throw new ApiError("Email, reset PIN, and new password are required.", 400);
  }

  if (!/^\d{6}$/.test(String(pin).trim())) {
    throw new ApiError("Reset PIN must be a 6-digit code.", 400);
  }

  if (!strongPasswordPattern.test(password)) {
    throw new ApiError(
      "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.",
      400
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  /*
    User enters PIN.
    We hash entered PIN and compare it with hashed PIN saved in MongoDB.
  */
  const hashedPin = crypto
    .createHash("sha256")
    .update(String(pin).trim())
    .digest("hex");

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordToken: hashedPin,
    resetPasswordExpires: { $gt: new Date() }
  }).select("+password");

  if (!user) {
    throw new ApiError("Reset PIN is invalid or expired.", 400);
  }

  /*
    Setting password then saving triggers User.js password hashing.
  */
  user.password = password;
  user.resetPasswordToken = "";
  user.resetPasswordExpires = null;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password reset successfully. You can now log in."
  });
});