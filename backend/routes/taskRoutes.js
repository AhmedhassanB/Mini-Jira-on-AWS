import { Router } from "express";

import {
  createTask,
  getAllTasks,
  getTaskById,
  updateTask,
  deleteTask,
  getTasksByTeam,
  getTasksByAssignee,
  getTasksByProject,
} from "../controllers/taskController.js";

const router = Router();

// Collection routes
router.post("/", createTask);
router.get("/", getAllTasks);

// Filtered queries — defined before /:id to avoid param conflict
router.get("/team/:teamId", getTasksByTeam);
router.get("/assignee/:assigneeId", getTasksByAssignee);
router.get("/project/:projectId", getTasksByProject);

// Single-resource routes
router.get("/:id", getTaskById);
router.put("/:id", updateTask);
router.delete("/:id", deleteTask);

export default router;
