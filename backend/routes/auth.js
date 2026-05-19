import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { signup, confirmSignup, login, me, updateProfile, testProtected } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/confirm", confirmSignup);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.patch("/me", authMiddleware, updateProfile);
router.get("/protected", authMiddleware, testProtected);

export default router;
