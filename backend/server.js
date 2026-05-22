import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import authRoute from "./routes/auth.js";
import oidcRoute from "./routes/oidc.js";
import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import dynamoDB from "./config/dynamodb.js";
import { ListTablesCommand } from "@aws-sdk/client-dynamodb";

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",   // Vite dev server
      "http://127.0.0.1:5173",   // Vite dev server (IPv4 explicit)
      "http://localhost:3000",
      process.env.CLOUDFRONT_URL,
      process.env.ALB_URL,
    ].filter(Boolean),
    credentials: true,
  }),
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mini-jira-dev-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

app.use("/auth", authRoute);
app.use("/oidc", oidcRoute);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/users", userRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", env: process.env.NODE_ENV });
});

// Deep health check — tests DynamoDB connectivity and lists tables
app.get("/api/health", async (_req, res) => {
  const checks = {
    status: "ok",
    region: process.env.AWS_REGION || "us-east-1",
    nodeEnv: process.env.NODE_ENV,
    dynamoDB: { connected: false, tables: [], error: null },
    expectedTables: [
      process.env.DYNAMODB_TABLE_TASKS    || "Tasks",
      process.env.DYNAMODB_TABLE_PROJECTS || "Projects",
      process.env.DYNAMODB_TABLE_USERS    || "Users",
      process.env.DYNAMODB_TABLE_TEAMS    || "Teams",
      process.env.DYNAMODB_TABLE_COMMENTS || "Comments",
    ],
    credentials: {
      hasAccessKey: !!(process.env.AWS_ACCESS_KEY_ID),
      hasSecretKey:  !!(process.env.AWS_SECRET_ACCESS_KEY),
    },
  };

  try {
    const result = await dynamoDB.send(new ListTablesCommand({}));
    checks.dynamoDB.connected = true;
    checks.dynamoDB.tables = result.TableNames || [];

    const missing = checks.expectedTables.filter(
      (t) => !checks.dynamoDB.tables.includes(t)
    );
    checks.dynamoDB.missingTables = missing;
    if (missing.length > 0) checks.status = "degraded";
  } catch (err) {
    checks.status = "error";
    checks.dynamoDB.error = err.message;
    checks.dynamoDB.hint =
      "Check AWS credentials: set AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY in backend/.env " +
      "or run 'aws configure' to use the shared credentials file.";
  }

  res.status(checks.status === "ok" ? 200 : 503).json(checks);
});

app.use(express.static(join(__dirname, '../frontend/dist')));
app.get('/{*path}', (req, res) => {
  res.sendFile(join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
