import express from "express";
import {
  getEventOffers,
  getEventOfferById,
  createEventOffer,
  updateEventOffer,
  deleteEventOffer
} from "../controllers/eventOfferController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  Public routes:
  Used by the Events & Offers page.
*/
router.get("/", getEventOffers);
router.get("/:id", getEventOfferById);

/*
  Admin routes:
  Only admin can create, edit, and delete events/offers.
*/
router.post("/admin", protect, adminOnly, createEventOffer);
router.put("/admin/:id", protect, adminOnly, updateEventOffer);
router.delete("/admin/:id", protect, adminOnly, deleteEventOffer);

export default router;