# TaskFlow

A self-hosted project & task manager built with the MERN stack + Docker, with a focus on a hardened, production-style deployment.

## Stack

- **MongoDB** — database (auth enabled)
- **Express + Node.js** — REST API
- **React + Vite** — frontend
- **Nginx** — reverse proxy
- **Tailwind CSS** — styling
- **JWT (httpOnly cookie)** — authentication

## Features

- Register / Login with JWT stored in an httpOnly cookie
- Create and manage projects (with color coding)
- Kanban board per project (Todo / In Progress / Done)
- Task priority (low / medium / high) + due dates
- Overdue task highlighting
- Progress bar per project
- GitHub integration — connect a token, browse repos, track and sync repo stats

## Security

Security hardening applied across the app and deployment:

- **httpOnly cookie auth** — JWT is never exposed to JavaScript (`httpOnly`, `SameSite=Strict`, `Secure` gated by `COOKIE_SECURE`), mitigating token theft via XSS; server-side logout clears the cookie.
- **JWT verification pinned** to `HS256` (no algorithm-confusion).
- **Password hashing** with bcrypt (cost 12).
- **Per-route rate limiting** — separate limiters for login (brute-force) and registration (spam).
- **Input validation** via `express-validator` (length caps, enums, ID/format checks) on all write routes.
- **Authorization checks** — every project/task/GitHub query is scoped to the owner (no IDOR); update fields are whitelisted (no mass-assignment / NoSQL injection).
- **GitHub tokens encrypted at rest** with AES-256-GCM.
- **HTTP hardening** — `helmet`, locked CORS (same-origin), request body caps (10kb API / 1m proxy), and nginx security headers including a Content-Security-Policy.
- **MongoDB authentication required**; the exposed `mongo-express` admin UI was removed.
- **Container hardening** — non-root backend container, reproducible `npm ci` builds from committed lockfiles.

## Quick Start

### 1. Clone

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

- `MONGO_INITDB_ROOT_USERNAME` / `MONGO_INITDB_ROOT_PASSWORD` — Mongo root credentials.
- `MONGO_URI` — must include the **same** credentials (use a password without URI-reserved characters, or percent-encode them).
- `JWT_SECRET` — a long random string.
- `ENCRYPTION_KEY` — 32-byte hex key for GitHub token encryption: `openssl rand -hex 32`.
- `COOKIE_SECURE` — `true` when served over HTTPS, `false` for plain-HTTP local testing.

### 3. Run

```bash
docker compose up --build -d
```

App available at `http://localhost` (or your server's address).

## Development

```bash
# Backend
cd backend && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | — | Register |
| POST | /api/auth/login | — | Login |
| POST | /api/auth/logout | — | Clear session cookie |
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/projects | ✓ | List projects |
| POST | /api/projects | ✓ | Create project |
| PUT | /api/projects/:id | ✓ | Update project |
| DELETE | /api/projects/:id | ✓ | Delete project |
| GET | /api/tasks?project=id | ✓ | List tasks |
| POST | /api/tasks | ✓ | Create task |
| PUT | /api/tasks/:id | ✓ | Update task |
| DELETE | /api/tasks/:id | ✓ | Delete task |
| GET | /api/github/status | ✓ | GitHub connection status |
| POST | /api/github/token | ✓ | Connect GitHub token |
| DELETE | /api/github/token | ✓ | Disconnect GitHub |
| GET | /api/github/repos | ✓ | List GitHub repos |
| POST | /api/github/track | ✓ | Track a repo as a project |
| POST | /api/github/sync/:id | ✓ | Sync tracked repo stats |

## Deployment

Production deploys run via GitHub Actions over a Tailscale tunnel (no public SSH/origin exposure), pulling `main` and rebuilding the Docker stack on the server. Fronting the origin with Cloudflare is recommended; restrict the origin firewall to Cloudflare IP ranges (or use a Cloudflare Tunnel) so the real server IP can't be reached directly.
```
