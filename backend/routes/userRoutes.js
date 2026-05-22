import { Router } from "express";
import { authMiddleware, requireAdmin, requireManagerOrAdmin } from "../middleware/auth.js";
import { getAllUsers, assignUserToTeam, removeUserFromTeam } from "../controllers/userController.js";

const router = Router();

// Managers and admins can list users (needed to display team members)
router.get("/", authMiddleware, requireManagerOrAdmin, getAllUsers);
// Only admins can reassign a user to a different team
router.patch("/:userId/team", authMiddleware, requireAdmin, assignUserToTeam);
// Only admins can remove a user from their team
router.delete("/:userId/team", authMiddleware, requireAdmin, removeUserFromTeam);

export default router;
