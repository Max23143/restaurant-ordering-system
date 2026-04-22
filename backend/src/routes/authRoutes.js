import express from "express";
import {
  requestRegisterOtp,
  verifyRegisterOtp,
  registerUser,
  loginUser,
  getMyProfile,
  deleteMyAccount
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register/request-otp", requestRegisterOtp);
router.post("/register/verify-otp", verifyRegisterOtp);

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", protect, getMyProfile);
router.delete("/me", protect, deleteMyAccount);

export default router;