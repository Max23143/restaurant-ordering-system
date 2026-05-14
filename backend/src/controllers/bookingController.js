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
    throw new ApiError("All required booking fields must be provided.", 400);
  }

  const booking = await Booking.create({
    user: req.user._id,
    fullName,
    email,
    phone,
    bookingDate,
    bookingTime,
    guests,
    notes: notes || ""
  });

  res.status(201).json({
    success: true,
    message: "Booking created successfully.",
    data: booking
  });
});

export const getMyBookings = catchAsync(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings
  });
});

export const updateMyBooking = catchAsync(async (req, res) => {
  const {
    fullName,
    email,
    phone,
    bookingDate,
    bookingTime,
    guests,
    notes
  } = req.body;

  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!booking) {
    throw new ApiError("Booking not found.", 404);
  }

  booking.fullName = fullName ?? booking.fullName;
  booking.email = email ?? booking.email;
  booking.phone = phone ?? booking.phone;
  booking.bookingDate = bookingDate ?? booking.bookingDate;
  booking.bookingTime = bookingTime ?? booking.bookingTime;
  booking.guests = guests ?? booking.guests;
  booking.notes = notes ?? booking.notes;

  await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking updated successfully.",
    data: booking
  });
});

export const deleteMyBooking = catchAsync(async (req, res) => {
  const booking = await Booking.findOne({
    _id: req.params.id,
    user: req.user._id
  });

  if (!booking) {
    throw new ApiError("Booking not found.", 404);
  }

  await Booking.findByIdAndDelete(booking._id);

  res.status(200).json({
    success: true,
    message: "Booking deleted successfully."
  });
});