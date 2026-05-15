import express from "express";
import {
  createBooking,
  getMyBookings,
  updateMyBooking,
  deleteMyBooking,
  getAllBookingsAdmin,
  updateBookingStatusAdmin
} from "../controllers/bookingController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.put("/my-bookings/:id", protect, updateMyBooking);
router.delete("/my-bookings/:id", protect, deleteMyBooking);

router.get("/admin/all", protect, admin, getAllBookingsAdmin);
router.put("/admin/:id/status", protect, admin, updateBookingStatusAdmin);

export default router;