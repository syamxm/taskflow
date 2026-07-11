# TaskFlow

A self-hosted project & task manager built with the MERN stack + Docker, with a focus on a hardened, production-style deployment and a security-gated CI/CD pipeline.

## Stack

- **MongoDB** — database (auth enabled)
- **Express + Node.js** — REST API
- **React + Vite** — frontend
- **Nginx** — reverse proxy
- **Tailwind CSS** — styling
- **JWT (httpOnly cookie)** — authentication
- **GitHub Actions** — CI/CD with a security gate (scan suite → deploy)

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
- **HTTP hardening** — `helmet`, locked CORS (`CORS_ORIGIN`, rejects all cross-origin when unset), request body caps (10kb API / 1m proxy), and nginx security headers: a Content-Security-Policy, HSTS (preload), `X-Frame-Options`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`. `server_tokens` is off; the real client IP is taken from `CF-Connecting-IP` only within Cloudflare's address range.
- **MongoDB authentication required**; the exposed `mongo-express` admin UI was removed.
- **Network isolation** — only nginx is reachable from outside (via the external `proxy-net`); MongoDB, the API, and the static frontend sit on an `internal` Docker network with no published ports.
- **Container hardening** — non-root backend (`node:26-alpine`) and a multi-stage frontend served by `nginx-unprivileged` (non-root); reproducible `npm ci` builds from committed lockfiles.

## DevSecOps Pipeline

Every pull request and dev-branch push runs the full security scan suite plus build/smoke checks. A push to `main` re-runs the **same** suite as a hard gate — deployment only proceeds if it passes.

### Flow

```
PR / push to any non-main branch   →  .github/workflows/security.yml
    ├─ security        (reusable scan suite — see table below)
    ├─ frontend-build  (npm ci && npm run build)
    └─ backend-smoke   (boot against mongo:7, poll /api/health)

push to main / manual dispatch     →  .github/workflows/deploy.yml
    ├─ security        (same reusable scan suite — required gate)
    └─ deploy          (needs: security) → Tailscale tunnel → SSH → docker compose
                         serialized via a deploy-production concurrency lock

weekly (Mon 02:00 UTC) / manual    →  .github/workflows/dast.yml
    └─ dast            (OWASP ZAP baseline against an ephemeral compose stack — advisory)
```

The scan suite lives in one reusable workflow, `security-scan.yml`, called by both `security.yml` and `deploy.yml`, so the gate is single-sourced (DRY) and PRs are checked against the exact suite that guards production.

### Scanners

| Tool | What it checks | Blocks merge/deploy? |
|------|----------------|----------------------|
| **Gitleaks** | Hardcoded secrets across full git history | Yes |
| **Semgrep** | SAST — `p/default`, `p/javascript`, `p/nodejs`, `p/owasp-top-ten` | Yes |
| **Trivy (fs)** | Dependency CVEs in backend & frontend | Yes |
| **Hadolint** | Dockerfile best-practices / hardening lint | Yes |
| **Trivy (config)** | IaC misconfiguration (compose, Dockerfiles) | Yes |
| **Trivy (image)** | CVEs in built backend & frontend images | Yes |
| **OWASP ZAP** | DAST baseline, scheduled weekly (Mon 02:00 UTC) + on demand | No (advisory) |

One tool per concern: Gitleaks owns secrets, Semgrep owns first-party code, Trivy owns dependency/image/IaC CVEs, Hadolint owns Dockerfile lint.

Scans gate on `HIGH,CRITICAL` by default. Semgrep and Trivy image results are uploaded as SARIF and surface in the repo's **GitHub Security** tab.

### Supply chain

- **Dependabot** — monthly updates for npm (backend + frontend), GitHub Actions, and Docker base images. Minor/patch updates are grouped and auto-merged (`dependabot-auto-merge.yml`); major bumps arrive as separate PRs for manual review.
- Actions and base images are version-tag pinned, with Dependabot raising monthly bump PRs.

### Accepted risk

`.trivyignore` holds vetted exceptions — each entry must carry a justification and a recheck trigger (e.g. the esbuild dev-server CVEs, which never ship to production).

Pipeline config lives at the repo root: `.gitleaks.toml`, `.hadolint.yaml`, `.trivyignore`, `.zap/rules.tsv`, and the CI compose override `docker-compose.ci.yml`.

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
- `CORS_ORIGIN` — allowed cross-origin (optional); cross-origin requests are rejected when unset.

### 3. Run

```bash
docker compose --env-file backend/.env up --build -d
```

The `--env-file` flag lets compose read the Mongo root credentials for the
`mongo` service; the backend container still loads the full `backend/.env`.

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
| GET | /api/health | — | Liveness/readiness probe |
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
| POST | /api/github/sync-all | ✓ | Sync all tracked repos |

## Deployment

Production deploys run via GitHub Actions over a Tailscale tunnel (no public SSH/origin exposure), pulling `main` and rebuilding the Docker stack on the server. The `deploy` job is gated on the full [security scan suite](#devsecops-pipeline) passing (`needs: security`) and is serialized by a `deploy-production` concurrency lock so deploys never overlap. Fronting the origin with Cloudflare is recommended; restrict the origin firewall to Cloudflare IP ranges (or use a Cloudflare Tunnel) so the real server IP can't be reached directly.
```
