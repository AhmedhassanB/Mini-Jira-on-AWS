import express from "express";

import {
  testRegion,
  getTables,
  createTask,
  getAllTasks,
  getTaskById,
  deleteTask,
  updateTaskStatus,
  getTasksByTeam,
} from "../controllers/taskController.js";

const router = express.Router();

router.get("/test", testRegion);

router.get("/tables", getTables);

router.post("/", createTask);

router.get("/", getAllTasks);

router.get("/team/:teamId", getTasksByTeam);

router.get("/:id", getTaskById);

router.delete("/:id", deleteTask);

router.put("/:id", updateTaskStatus);

export default router;
