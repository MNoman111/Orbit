# Orbit

A multi-tenant project & task management SaaS built with the MERN stack and TypeScript end to end. One deployment serves many independent organizations; each tenant's data is isolated by construction. Built as a portfolio piece that demonstrates production-grade architecture, and structured to extend into a sellable product.

> **The headline:** tenant isolation is enforced centrally — not by remembering to add a filter to each query. See [Multi-tenancy](#multi-tenancy) and the [cross-tenant isolation test](server/src/__tests__/isolation.test.ts).

## Stack

| Layer    | Tech                                                            |
| -------- | --------------------------------------------------------------- |
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router        |
| Backend  | Node, Express, TypeScript, Mongoose                             |
| Database | MongoDB (tenant-scoped collections)                             |
| Auth     | JWT access tokens + rotating, revocable refresh tokens (cookie) |
| Tests    | Vitest + Supertest + mongodb-memory-server                      |
| Infra    | Docker Compose, GitHub Actions CI                               |

## Architecture

```
React SPA  ──HTTPS/JSON──▶  Express API  ──▶  MongoDB
(Vite+TS)                   routes → middleware → services → models
```

Strict layering: **routes** declare paths, **middleware** handles cross-cutting concerns (auth, tenant resolution, RBAC, validation, errors), **services** own all business logic and are unit-testable without HTTP, and **models** are persistence only. This separation is what keeps the system testable.

```
server/src/
  config/        env validation (fail-fast), db connection
  middleware/    auth · tenant · rbac · validate · error · asyncHandler
  models/        User · Organization · Membership · Project · Task · ActivityLog · RefreshToken
  services/      auth · project · task   (all business logic)
  routes/        thin HTTP layer delegating to services
  validators/    Zod request schemas
  __tests__/     cross-tenant isolation + RBAC
web/src/
  api/           typed axios client (token + org injection, 401→refresh retry) and query hooks
  lib/           auth context, token store, shared types
  components/    ProtectedRoute, Layout (org switcher)
  pages/         Login · Register · Projects · Board (Kanban)
api/             Vercel serverless entry — wraps the Express app
vercel.json      single-project deploy: static web + serverless api
```

## Multi-tenancy

Orbit uses **shared collections with an enforced `orgId` discriminator** — the right fit for a SaaS with many small-to-mid tenants. Isolation rests on three mechanisms:

1. **Tenant resolution** — the `resolveTenant` middleware reads the org from the `X-Org-Id` header and accepts it *only* if the authenticated user has an active `Membership` in it. Unknown/unauthorized orgs return `404` (never reveal existence). Every handler downstream reads a `req.orgId` that is guaranteed to belong to the caller.
2. **Scoped queries** — every service method takes `orgId` as its first argument and threads it into every read, write, and delete. Application code never queries a tenant-owned model without the scope.
3. **Tenant-leading indexes** — compound indexes lead with `orgId` (e.g. `{ orgId, projectId, status, order }`) so queries are both isolated and fast.

The [`isolation.test.ts`](server/src/__tests__/isolation.test.ts) suite proves a user in org A cannot read org B's data even with a valid token.

## Auth model

- **Access token** — 15 min, stateless, sent as `Authorization: Bearer`.
- **Refresh token** — 7 days, httpOnly secure cookie, persisted as a revocable record and **rotated on every refresh** (replay protection; logout revokes it). The client retries a single `/auth/refresh` automatically on a `401`.
- Passwords hashed with bcrypt (cost 12). Registration creates the user, their first org, and an owner membership in one transaction.

## Authorization (RBAC)

Roles `owner > admin > member > viewer` with a single privilege-ranked permission map. `requireRole('admin')` guards sensitive routes (e.g. deleting projects, managing members). Keeping permissions in one place — not scattered through controllers — makes authorization auditable.

## Running locally

### Option A — Docker (everything)

```bash
docker compose up --build
# web → http://localhost:5173   api → http://localhost:4000/healthz
```

### Option B — manual

You need MongoDB as a **single-node replica set** (transactions are used at registration):

```bash
# backend
cd server
cp .env.example .env          # then set the JWT secrets
npm install
npm run dev                   # http://localhost:4000

# frontend (new terminal)
cd web
npm install
npm run dev                   # http://localhost:5173
```

## Deploy to Vercel (live demo)

Orbit deploys as a **single Vercel project**: the React app is served as static files and the Express API runs as a serverless function under `/api`, both on the same domain. Same-origin means the auth cookies just work — no CORS or cross-site-cookie configuration needed.

### 1. Create a MongoDB Atlas database (free)

1. Create a free **M0** cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas) (the free tier is a replica set, so the transaction used at registration works).
2. Under **Database Access**, create a user with a password.
3. Under **Network Access**, add `0.0.0.0/0` (allow from anywhere — fine for a demo).
4. Copy the connection string, e.g. `mongodb+srv://USER:PASS@cluster0.xxxx.mongodb.net/orbit?retryWrites=true&w=majority`.

### 2. Push the repo to GitHub

```bash
cd orbit
git init && git add . && git commit -m "Orbit"
git remote add origin <your-repo-url> && git push -u origin main
```

### 3. Import into Vercel

At [vercel.com/new](https://vercel.com/new), import the repo. Leave **Root Directory** as the repo root and don't override the build settings — `vercel.json` configures both builds. Before the first deploy, add these **Environment Variables** (Project → Settings → Environment Variables):

| Variable             | Value                                                            |
| -------------------- | --------------------------------------------------------------- |
| `MONGO_URI`          | your Atlas connection string                                    |
| `JWT_ACCESS_SECRET`  | a long random string (see below)                                |
| `JWT_REFRESH_SECRET` | a different long random string                                  |

Generate secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`NODE_ENV` is set to `production` by Vercel automatically (this also enables the `Secure` cookie flag). `ACCESS_TOKEN_TTL` and `REFRESH_TOKEN_TTL` have sensible defaults; override them only if you want to.

### 4. Deploy and test

Click **Deploy**. When it finishes, open the deployment URL:

- `https://<your-app>.vercel.app` → the app. Register an account, create a project, add and move tasks.
- `https://<your-app>.vercel.app/api/v1/me` → the API (returns 401 until you're signed in — confirms the function is live).

Every push to `main` redeploys automatically.

### How it fits together

- `vercel.json` builds the frontend (`web/`, static) and the API (`api/index.ts`, serverless), then routes `/api/*` and `/healthz` to the function and serves the SPA for everything else.
- `api/index.ts` wraps the Express app and reuses a cached Mongo connection across warm invocations (`server/src/config/serverlessDb.ts`).
- The frontend calls the API with the relative path `/api/v1`, so no API URL needs configuring in production.

> **Note:** in-memory rate limiting is per-instance on serverless (each cold container has its own counters), so it's best-effort in this mode. For strict limits, back it with Redis (Upstash) — see the build plan.

## Testing

```bash
cd server
npm test          # unit + integration (in-memory Mongo replica set)
npm run typecheck
```

## API surface (v1)

```
POST /auth/register · /auth/login · /auth/refresh · /auth/logout    GET /me
GET/POST /projects   GET/PATCH/DELETE /projects/:id
GET/POST /projects/:id/tasks   PATCH/DELETE /tasks/:id
```

All org-scoped routes require the `X-Org-Id` header.

## Roadmap

Implemented: auth + tenancy + RBAC, projects, tasks, Kanban board, org switcher, isolation tests, Docker, CI.

Next: comments + activity feed UI, member invitations, Socket.io live board updates, Stripe subscription billing with plan-gated limits, Playwright E2E. See [`Orbit-Build-Plan.md`](../Orbit-Build-Plan.md) for the full design.

## License

MIT — use it freely as a portfolio base.
