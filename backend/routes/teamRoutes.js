import { Router } from "express";

import {
  createTeam,
  getAllTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
} from "../controllers/teamController.js";

const router = Router();

// Collection routes
router.post("/", createTeam);
router.get("/", getAllTeams);

// Single-resource routes
router.get("/:id", getTeamById);
router.put("/:id", updateTeam);
router.delete("/:id", deleteTeam);

export default router;
