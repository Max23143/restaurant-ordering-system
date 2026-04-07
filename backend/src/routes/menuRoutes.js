import express from "express";
import {
  createMenuItem,
  deleteMenuItem,
  getMenuItemById,
  getMenuItems,
  getMenuMessage,
  updateMenuItem,
} from "../controllers/menuController.js";

const router = express.Router();

router.get("/", getMenuItems);
router.get("/message", getMenuMessage);
router.get("/:id", getMenuItemById);
router.post("/", createMenuItem);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);

export default router;