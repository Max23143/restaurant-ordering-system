import express from "express";
import {
  registerUser,
  loginUser,
  getMyProfile,
  deleteMyAccount,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/me", protect, getMyProfile);
router.delete("/me", protect, deleteMyAccount);

export default router;