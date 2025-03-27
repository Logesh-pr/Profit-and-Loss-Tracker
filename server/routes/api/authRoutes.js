import express from "express";
import {
  register,
  login,
  getMe,
  logout,
} from "../../controller/authController.js";
import { protect } from "../../middleware/auth.js";

const router = express.Router();

// Register user
router.post("/register", register);

// Login user
router.post("/login", login);

// Get current user
router.get("/me", protect, getMe);

// Logout user
router.post("/logout", logout);

export default router;
