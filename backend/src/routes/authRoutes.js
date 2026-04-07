import express from "express";
import { getAuthMessage, loginUser, registerUser } from "../controllers/authController.js";

const router = express.Router();

router.get("/", getAuthMessage);
router.post("/register", registerUser);
router.post("/login", loginUser);

export default router;