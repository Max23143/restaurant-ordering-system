import express from "express";
import {
  createBooking,
  getMyBookings,
  getMyBookingById,
  getAllBookings,
  getBookingByIdAdmin,
  updateBookingStatus
} from "../controllers/bookingController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  Customer routes
*/
router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.get("/my-bookings/:id", protect, getMyBookingById);

/*
  Admin routes
*/
router.get("/admin/all", protect, adminOnly, getAllBookings);
router.get("/admin/:id", protect, adminOnly, getBookingByIdAdmin);
router.put("/admin/:id/status", protect, adminOnly, updateBookingStatus);

export default router;