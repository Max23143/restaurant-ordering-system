import express from "express";
import {
  createReview,
  getReviewsByMenuItem,
  getMyReviews,
  updateMyReview,
  deleteMyReview,
  getAllReviews,
  toggleReviewApproval
} from "../controllers/reviewController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  Public / customer routes
*/
router.get("/menu/:menuItemId", getReviewsByMenuItem);
router.post("/", protect, createReview);
router.get("/my-reviews", protect, getMyReviews);
router.put("/:id", protect, updateMyReview);
router.delete("/:id", protect, deleteMyReview);

/*
  Admin routes
*/
router.get("/admin/all", protect, adminOnly, getAllReviews);
router.put("/admin/:id/approval", protect, adminOnly, toggleReviewApproval);

export default router;