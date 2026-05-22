import { Router } from "express";
import { authMiddleware, requireManager } from "../middleware/auth.js";

import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByTeam,
} from "../controllers/projectController.js";

const router = Router();

// Only managers can create projects
router.post("/", authMiddleware, requireManager, createProject);
// All authenticated users can read projects
router.get("/", authMiddleware, getAllProjects);

// Filtered query — must be defined before /:id to avoid param conflict
router.get("/team/:teamId", authMiddleware, getProjectsByTeam);

// Single-resource routes
router.get("/:id", authMiddleware, getProjectById);
// Only managers can update or delete projects
router.put("/:id", authMiddleware, requireManager, updateProject);
router.delete("/:id", authMiddleware, requireManager, deleteProject);

export default router;
