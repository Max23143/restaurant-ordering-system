import express from "express";
import {
  getRecommendationsByMenuItem,
  getTopRatedRecommendations,
  getPersonalizedRecommendations
} from "../controllers/recommendationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/top-rated", getTopRatedRecommendations);
router.get("/menu/:menuItemId", getRecommendationsByMenuItem);
router.get("/personalized", protect, getPersonalizedRecommendations);

export default router;