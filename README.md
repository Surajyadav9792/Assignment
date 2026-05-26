# ForgeFlow — BDA Operations Suite

**Manufacturing sales, refined.** A purpose-built BDA Team Module for manufacturing companies — leads, pipeline, quotes, samples, and team performance, all in one focused workspace.

Built as a recruitment assessment submission. Stack: **MERN** (MongoDB, Express, React, Node.js).

---

## Demo credentials

All passwords: `Demo@2026`

| Role | Email |
|---|---|
| Admin | `admin@forgeflow.com` |
| Manager | `manager@forgeflow.com` |
| BDA · Ravi | `ravi.bda@forgeflow.com` |
| BDA · Priya | `priya.bda@forgeflow.com` |
| BDA · Arjun | `arjun.bda@forgeflow.com` |

These are seeded by `npm run seed` and shown on the Login page (click any role to autofill).

---

## What's inside

- **Authentication & RBAC** — JWT, 3 roles (Admin / Manager / BDA)
- **Lead management** — list, table, detail, kanban
- **Pipeline Kanban** with drag-and-drop (`@dnd-kit`) and optimistic updates
- **Activity timeline** — calls, emails, meetings, notes, samples, RFQs, stage changes
- **Tasks** — "My Day" with overdue / today / week sections
- **Quotes** — line-item editor, PDF generation (pdfkit), status lifecycle
- **Samples** — dispatch + feedback tracking
- **Analytics** — Funnel, Leaderboard, Forecast, 90-day Heatmap, Stuck Deals
- **Admin settings** — Users, Products, Pipeline stages (drag-reorder), Lead sources
- **Notifications** — bell with unread count
- **Dark theme** — custom design tokens, Inter + JetBrains Mono, Lucide icons

---

## Project structure

```
forgeflow/
├── backend/            # Express + Mongoose API
│   ├── server.js       # entry — dual mode (local listener / Vercel handler)
│   ├── vercel.json     # Vercel config for backend project
│   └── src/
│       ├── config/
│       ├── models/     # 11 Mongoose models
│       ├── controllers/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       ├── utils/
│       └── seed/seed.js
├── frontend/           # React 18 + Vite SPA
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/
│       ├── store/
│       ├── design/
│       └── lib/
├── docker-compose.yml  # MongoDB (local dev)
├── .env.example        # all env vars in one place
└── README.md
```

Only two app folders at the root: `backend/` and `frontend/`. They're independent — each has its own `package.json`, its own dependencies, and can be deployed to its own Vercel project.

---

## Local setup

### 1. MongoDB

```bash
docker compose up -d        # or any local Mongo on port 27017
```

### 2. Backend

```bash
cd backend
cp ../.env.example .env     # then edit values if needed
npm install
npm run seed                # populates DB with demo data
npm run dev                 # → http://localhost:5000
```

### 3. Frontend (new terminal)

```bash
cd frontend
cp .env.example .env        # (frontend has its own env.example for VITE_ vars)
npm install
npm run dev                 # → http://localhost:5173
```

Open http://localhost:5173 — log in with any seeded role.

---

## Deploy to Vercel (two projects)

Because the backend and frontend are independent, they deploy as **two separate Vercel projects** from the same Git repo. This is the cleanest setup: each scales on its own, has its own URL, and Vercel auto-detects the framework for each.

### Prerequisites

- A **MongoDB Atlas** cluster (free M0 tier works). Get its connection URI.
- A **GitHub repo** containing this project.
- A **Vercel account** (free).

### Step 1 — Push to GitHub

```bash
git init && git add . && git commit -m "ForgeFlow initial"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2 — Deploy the backend

1. On Vercel, click **Add New → Project** and import your repo.
2. **Root Directory**: `backend`
3. **Framework Preset**: Other
4. Leave Build/Output as Vercel detects them (the `backend/vercel.json` defines a serverless build for `server.js`).
5. Add these **Environment Variables**:

   | Key | Value |
   |---|---|
   | `MONGO_URI` | Your MongoDB Atlas URI |
   | `JWT_SECRET` | 48+ char random string |
   | `JWT_EXPIRES_IN` | `24h` |
   | `NODE_ENV` | `production` |
   | `FRONTEND_ORIGIN` | (set later, after the frontend is deployed) |

6. Click **Deploy**. You'll get a URL like `https://forgeflow-api.vercel.app`. Test it:
   ```
   curl https://forgeflow-api.vercel.app/health
   # → {"ok":true}
   ```

### Step 3 — Seed the production database

One-time from your local machine, pointing at the Atlas URI:

```bash
# Windows PowerShell
$env:MONGO_URI="mongodb+srv://..."
cd backend
npm run seed
```

```bash
# macOS / Linux
MONGO_URI="mongodb+srv://..." npm run seed
```

### Step 4 — Deploy the frontend

1. On Vercel, click **Add New → Project** and import the **same repo** again.
2. **Root Directory**: `frontend`
3. **Framework Preset**: Vite (auto-detected).
4. Add **Environment Variables**:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://forgeflow-api.vercel.app/api/v1` (your backend URL + `/api/v1`) |
   | `VITE_APP_NAME` | `ForgeFlow` |

5. Click **Deploy**. You'll get a URL like `https://forgeflow.vercel.app`.

### Step 5 — Wire CORS

Back in the **backend** Vercel project, set:

| Key | Value |
|---|---|
| `FRONTEND_ORIGIN` | `https://forgeflow.vercel.app` (your frontend URL) |

Redeploy the backend (Vercel → Deployments → ... → Redeploy).

### Step 6 — Visit and log in

Open the frontend URL. Log in with the seeded demo credentials. Everything works.

---

## Architecture highlights

### Authentication
- JWT signed with `JWT_SECRET`, 24h expiry. Token stored in `localStorage`.
- Axios interceptor reads the token fresh on every request.
- 401 → auto-logout + redirect to `/login?expired=1`.

### Lead score (rule-based)
```
score = 0.4 * normalizedValue
      + 0.3 * activityCountLast30d (capped @ 10)
      + 0.2 * recencyScore   (100 if <3d, 50 if <14d)
      + 0.1 * sourceQuality  (Referral=100, Trade Show=80, Website=60, etc.)
temperature: ≥70 hot · ≥40 warm · <40 cold
```
Recomputed on every activity insert + stage move.

### Pipeline drag
- `@dnd-kit/core` for accessible drag.
- Optimistic UI: card moves in cache via `onMutate`, reverted on error.

### Soft delete
- `lead.isArchived = true` rather than hard delete; queries filter by default.

### Vercel serverless backend
- `backend/server.js` exports the Express app on Vercel (detected via `process.env.VERCEL`) and starts a long-running listener locally.
- Mongoose connection cached via `global._ffMongo` so warm function invocations reuse the same connection.

---

## Demo walkthrough (16 steps)

1. Visit `/login`. Note the seeded credentials displayed.
2. Login as **Manager**.
3. Land on `/dashboard` — KPIs, funnel, leaderboard, stuck deals, team feed.
4. Navigate to `/pipeline` — populated Kanban with ~30 deals.
5. Drag a card from "Qualified" → "RFQ Received". Column totals update.
6. Click a card → `/leads/:id`. See profile, timeline, score.
7. Click **Log activity** → Type=Call, Outcome=Connected, add notes, set next follow-up → Save. Task auto-created.
8. Click **Create quote** → add line items → Save. Open the quote → **Send**. Lead advances to Quoted.
9. Click **View PDF** → PDF opens.
10. Navigate to `/analytics` → switch tabs (Funnel / Leaderboard / Forecast / Heatmap / Stuck).
11. Logout. Login as **BDA** (`ravi.bda@forgeflow.com`).
12. Land on `/dashboard` — BDA view, no Admin menu items.
13. Visit `/my-day` — overdue + today + this week sections.
14. Logout. Login as **Admin**.
15. Visit `/settings/pipeline` — drag-reorder a stage. Save. Visit `/pipeline` — order reflects.
16. Visit `/settings/users` — seeded users with roles.

---

## License

Proprietary — submitted for recruitment assessment.
