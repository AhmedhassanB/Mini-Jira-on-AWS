# Mini Jira – Frontend

A production-ready project management frontend built with React 19 + Vite + TailwindCSS + shadcn/ui, integrated with an AWS backend (Cognito + DynamoDB + S3 + Lambda).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + Vite 8 |
| Styling | TailwindCSS v3 + shadcn/ui |
| Routing | React Router v6 |
| Server State | TanStack Query v5 |
| Client State | Zustand v5 |
| HTTP | Axios |
| Drag & Drop | @dnd-kit |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Toasts | Sonner |

## Pages

- **Login / Register / Confirm Email** – Cognito authentication
- **Dashboard** – Stats, recent tasks, charts, due-today list
- **Kanban Board** – Drag-and-drop board with 4 columns
- **Projects** – CRUD with task progress tracking
- **Teams** – Team management and task counts
- **Analytics** – Charts, status/priority breakdowns
- **Activity Log** – Task timeline
- **Profile** – User info and task stats

## Project Structure

```
src/
├── components/
│   ├── ui/         # shadcn/ui primitives (Button, Input, Card, Dialog, etc.)
│   ├── layout/     # Sidebar, Navbar, ThemeToggle
│   ├── common/     # EmptyState, LoadingSkeleton, ConfirmDialog, Badges
│   ├── kanban/     # KanbanBoard, KanbanColumn, TaskCard
│   ├── tasks/      # TaskModal, CreateTaskModal, TaskComments, TaskFilters
│   └── charts/     # TaskStatusChart, TasksCreatedChart, TeamProductivityChart
├── pages/
│   ├── auth/       # Login, Register, ConfirmEmail
│   ├── Dashboard, KanbanPage, ProjectsPage, TeamsPage
│   ├── ProfilePage, AnalyticsPage, ActivityLogPage
├── hooks/          # useAuth, useTasks, useProjects, useTeams, useComments
├── services/       # api.js (Axios), authService, taskService, etc.
├── store/          # authStore (Zustand with persist)
├── routes/         # PrivateRoute
├── layouts/        # MainLayout, AuthLayout
└── utils/          # cn, helpers, constants
```

## Installation

```bash
cd frontend
npm install --legacy-peer-deps
```

## Development

```bash
# Start backend first (port 3000)
cd ../backend && npm run dev

# Then start frontend (port 5173)
cd ../frontend && npm run dev
```

The Vite dev server proxies `/api/*` and `/auth/*` to `http://localhost:3000`.

## Environment Variables

Copy `.env.example` to `.env.local`:

```bash
# Leave empty in development (Vite proxy handles routing to backend)
VITE_API_URL=

# In production, set to your backend URL:
# VITE_API_URL=https://api.yourdomain.com
```

## Production Build

```bash
npm run build
# Output goes to dist/
```

## Deployment

### AWS Amplify

1. Push the repository to GitHub.
2. Open the AWS Amplify Console and connect your GitHub repo.
3. Set the Build settings:

```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm install --legacy-peer-deps
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

4. Add environment variable `VITE_API_URL` pointing to your backend.
5. Add a Rewrite rule: `/<*>` → `/index.html` (200) for SPA routing.

### Vercel

1. Import the repo in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variable `VITE_API_URL`.
4. Vercel auto-detects Vite — deploy with zero config.

### CORS

In `backend/server.js`, allow your frontend origin:

```js
app.use(cors({ origin: 'https://your-frontend-url.com', credentials: true }))
```

## Role-Based Access

| Role | Capabilities |
|---|---|
| Employee | View own team's tasks, update status, comment |
| Manager | Full task CRUD, create projects & teams, filter by team |
| Admin | Manage users, teams, system settings |

Roles are stored in Cognito custom attributes and returned via `/auth/me`.
