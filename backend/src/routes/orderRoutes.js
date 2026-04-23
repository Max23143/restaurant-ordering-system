import express from "express";
import {
  createOrder,
  getMyOrders,
  getMyOrderById,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/* Customer routes */
router.post("/", protect, createOrder);
router.get("/my-orders", protect, getMyOrders);
router.get("/my-orders/:id", protect, getMyOrderById);

/* Admin routes */
router.get("/admin/all", protect, adminOnly, getAllOrders);
router.get("/admin/:id", protect, adminOnly, getOrderByIdAdmin);
router.put("/admin/:id/status", protect, adminOnly, updateOrderStatus);

export default router;