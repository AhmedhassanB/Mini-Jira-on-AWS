import { Router } from "express";

import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByTeam,
} from "../controllers/projectController.js";

const router = Router();

// Collection routes
router.post("/", createProject);
router.get("/", getAllProjects);

// Filtered query — must be defined before /:id to avoid param conflict
router.get("/team/:teamId", getProjectsByTeam);

// Single-resource routes
router.get("/:id", getProjectById);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

export default router;
