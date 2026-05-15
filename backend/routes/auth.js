import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import { signup, confirmSignup, resendCode, login, me, testProtected } from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/confirm", confirmSignup);
router.post("/resend", resendCode);
router.post("/login", login);
router.get("/me", authMiddleware, me);
router.get("/protected", authMiddleware, testProtected);

export default router;
