import User from "../models/User.js";
import Order from "../models/Order.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";
import generateToken from "../utils/generateToken.js";
import { sendSmsOtp, checkSmsOtp } from "../utils/sendSmsOtp.js";

const pendingRegistrations = new Map();

const normalizePhone = (phone) => String(phone || "").trim();

export const requestRegisterOtp = catchAsync(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password || !phone) {
    throw new ApiError("Full name, email, password, and phone are required.", 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPhone = normalizePhone(phone);

  const existingUserByEmail = await User.findOne({ email: normalizedEmail });
  if (existingUserByEmail) {
    throw new ApiError("User already exists with this email.", 400);
  }

  const existingUserByPhone = await User.findOne({ phone: normalizedPhone });
  if (existingUserByPhone) {
    throw new ApiError("User already exists with this phone number.", 400);
  }

  pendingRegistrations.set(normalizedPhone, {
    fullName,
    email: normalizedEmail,
    password,
    phone: normalizedPhone,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  await sendSmsOtp(normalizedPhone);

  res.status(200).json({
    success: true,
    message: "Registration OTP sent successfully to your phone."
  });
});

export const verifyRegisterOtp = catchAsync(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError("Phone and OTP are required.", 400);
  }

  const normalizedPhone = normalizePhone(phone);
  const pending = pendingRegistrations.get(normalizedPhone);

  if (!pending) {
    throw new ApiError("Registration request not found or expired.", 404);
  }

  if (pending.expiresAt < Date.now()) {
    pendingRegistrations.delete(normalizedPhone);
    throw new ApiError("OTP has expired.", 400);
  }

  const verificationCheck = await checkSmsOtp(normalizedPhone, String(otp).trim());

  if (verificationCheck.status !== "approved") {
    throw new ApiError("Invalid OTP.", 400);
  }

  const existingUser = await User.findOne({
    $or: [{ email: pending.email }, { phone: pending.phone }]
  });

  if (existingUser) {
    pendingRegistrations.delete(normalizedPhone);
    throw new ApiError("User already exists with this email or phone.", 400);
  }

  const user = await User.create({
    fullName: pending.fullName,
    email: pending.email,
    password: pending.password,
    phone: pending.phone
  });

  pendingRegistrations.delete(normalizedPhone);

  res.status(201).json({
    success: true,
    message: "User registered successfully.",
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

export const registerUser = catchAsync(async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (!fullName || !email || !password) {
    throw new ApiError("Full name, email, and password are required.", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError("User already exists with this email.", 400);
  }

  const user = await User.create({
    fullName,
    email: email.toLowerCase(),
    password,
    phone
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

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

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

export const deleteMyAccount = catchAsync(async (req, res) => {
  const userId = req.user._id;

  await Order.deleteMany({ user: userId });
  await Booking.deleteMany({ user: userId });
  await Review.deleteMany({ user: userId });
  await User.findByIdAndDelete(userId);

  res.status(200).json({
    success: true,
    message: "Your account and related data have been deleted successfully."
  });
});