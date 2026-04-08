import Booking from "../models/Booking.js";
import ApiError from "../utils/ApiError.js";
import catchAsync from "../utils/catchAsync.js";

export const createBooking = catchAsync(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    bookingDate,
    bookingTime,
    guests,
    notes
  } = req.body;

  if (!fullName || !email || !phone || !bookingDate || !bookingTime || !guests) {
    throw new ApiError(
      "Full name, email, phone, booking date, booking time, and guests are required.",
      400
    );
  }

  if (Number(guests) < 1) {
    throw new ApiError("Guests must be at least 1.", 400);
  }

  const booking = await Booking.create({
    user: req.user ? req.user._id : null,
    fullName,
    email: email.toLowerCase(),
    phone,
    bookingDate,
    bookingTime,
    guests: Number(guests),
    notes: notes || ""
  });

  const populatedBooking = await Booking.findById(booking._id).populate(
    "user",
    "fullName email phone"
  );

  res.status(201).json({
    success: true,
    message: "Booking created successfully",
    data: populatedBooking
  });
});

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

export const getMyBookingById = catchAsync(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!booking) {
    throw new ApiError("Booking not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

export const getAllBookings = catchAsync(async (req, res) => {
  const { status, date } = req.query;

  const filter = {};

  if (status) {
    filter.status = status;
  }

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);

    filter.bookingDate = {
      $gte: start,
      $lt: end
    };
  }

  const bookings = await Booking.find(filter)
    .populate("user", "fullName email phone")
    .sort({ bookingDate: 1, bookingTime: 1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

export const getBookingByIdAdmin = catchAsync(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    "user",
    "fullName email phone role"
  );

  if (!booking) {
    throw new ApiError("Booking not found.", 404);
  }

  res.status(200).json({
    success: true,
    data: booking
  });
});

export const updateBookingStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  const validStatuses = ["pending", "confirmed", "cancelled", "completed"];

  if (!status || !validStatuses.includes(status)) {
    throw new ApiError("A valid booking status is required.", 400);
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    throw new ApiError("Booking not found.", 404);
  }

  booking.status = status;
  await booking.save();

  const updatedBooking = await Booking.findById(booking._id).populate(
    "user",
    "fullName email phone"
  );

  res.status(200).json({
    success: true,
    message: "Booking status updated successfully",
    data: updatedBooking
  });
});