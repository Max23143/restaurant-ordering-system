import express from "express";
import authRoutes from "./authRoutes.js";
import menuRoutes from "./menuRoutes.js";
import orderRoutes from "./orderRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import reviewRoutes from "./reviewRoutes.js";
import recommendationRoutes from "./recommendationRoutes.js";

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy"
  });
});

router.use("/auth", authRoutes);
router.use("/menu", menuRoutes);
router.use("/orders", orderRoutes);
router.use("/bookings", bookingRoutes);
router.use("/reviews", reviewRoutes);
router.use("/recommendations", recommendationRoutes);

export default router;