import { Router } from "express";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

import {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";

const router = Router();

// Only admins can create, update, or delete teams
router.post("/", authMiddleware, requireAdmin, createTeam);
// All authenticated users can read teams (needed to populate dropdowns/UI)
router.get("/", authMiddleware, getAllTeams);

// Single-resource routes
router.get("/:id", authMiddleware, getTeamById);
router.put("/:id", authMiddleware, requireAdmin, updateTeam);
router.delete("/:id", authMiddleware, requireAdmin, deleteTeam);

export default router;
