import express from "express";
import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
  deleteMyAccount,
  forgotPassword,
  resetPassword
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/*
  Public auth routes
*/
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

/*
  Protected user profile routes
*/
router.get("/me", protect, getMyProfile);
router.put("/me", protect, updateMyProfile);
router.put("/me/password", protect, changeMyPassword);
router.delete("/me", protect, deleteMyAccount);

export default router;