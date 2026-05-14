import express from "express";
import {
  createBooking,
  getMyBookings,
  updateMyBooking,
  deleteMyBooking
} from "../controllers/bookingController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createBooking);
router.get("/my-bookings", protect, getMyBookings);
router.put("/my-bookings/:id", protect, updateMyBooking);
router.delete("/my-bookings/:id", protect, deleteMyBooking);

export default router;