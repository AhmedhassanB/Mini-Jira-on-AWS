import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";

import authRoute from "./routes/auth.js";
import oidcRoute from "./routes/oidc.js";
import taskRoutes from "./routes/taskRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";

const app = express();

app.use(
  cors({
    origin: [
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

app.set("view engine", "ejs");

app.use("/auth", authRoute);
app.use("/oidc", oidcRoute);
app.use("/api/tasks", taskRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/teams", teamRoutes);

app.get("/health", (_req, res) => {
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  res.render("home", {
    isAuthenticated: Boolean(req.session?.userInfo),
    userInfo: req.session?.userInfo || null,
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
