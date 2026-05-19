# TaskFlow

A self-hosted project & task manager built with the MERN stack + Docker.

## Stack

- **MongoDB** — database
- **Express + Node.js** — REST API
- **React + Vite** — frontend
- **Nginx** — reverse proxy
- **Tailwind CSS** — styling
- **JWT** — authentication

## Features

- Register / Login with JWT
- Create and manage projects (with color coding)
- Kanban board per project (Todo / In Progress / Done)
- Task priority (low / medium / high) + due dates
- Overdue task highlighting
- Progress bar per project

## Quick Start

### 1. Clone

```bash
git clone https://github.com/yourusername/taskflow.git
cd taskflow
```

### 2. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — set a strong JWT_SECRET
```

### 3. Run

```bash
docker compose up --build -d
```

App available at `http://localhost` (or your server IP).

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
| GET | /api/auth/me | ✓ | Current user |
| GET | /api/projects | ✓ | List projects |
| POST | /api/projects | ✓ | Create project |
| PUT | /api/projects/:id | ✓ | Update project |
| DELETE | /api/projects/:id | ✓ | Delete project |
| GET | /api/tasks?project=id | ✓ | List tasks |
| POST | /api/tasks | ✓ | Create task |
| PUT | /api/tasks/:id | ✓ | Update task |
| DELETE | /api/tasks/:id | ✓ | Delete task |
