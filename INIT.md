# Sagepoint Control Dashboard — Project Plan

## Context

VPS running a monorepo app (`sagepoint`) with:

- **Production**: `sagepoint_api` (port 3001), `sagepoint_worker`, `sagepoint_worker_2` (scale profile)
- **Staging**: `sagepoint_api_staging` (port 3002), `sagepoint_worker_staging`
- **Shared infra**: `sagepoint_postgres` (pgvector/pg17), `sagepoint_redis`, `sagepoint_neo4j`
- All containers on a `shared` external Docker network
- nginx reverse proxy in front

All containers defined in `docker-compose.prod.yml`. Images pulled from `ghcr.io/rodacevedof/sagepoint`.

## Goal

A simple **ops control dashboard** — a separate standalone project deployed on the same VPS.

## Architecture Decision

**Custom lightweight dashboard** (not Portainer). A small Node/Express backend + React frontend.

### Why not Portainer?

- Generic and heavy
- We want a purpose-built UI for this specific stack
- Easier to add custom checks (Redis queue depth, DB health, etc.)

---

## Proposed Stack

| Layer      | Choice                             | Reason                          |
| ---------- | ---------------------------------- | ------------------------------- |
| Backend    | Node.js + Express                  | Minimal, no framework overhead  |
| Frontend   | React + Vite                       | Fast dev, small bundle          |
| Styling    | Tailwind CSS                       | Utility-first, quick to build   |
| Docker API | Unix socket `/var/run/docker.sock` | No remote daemon needed         |
| Auth       | Simple Bearer token (env var)      | VPS-internal, no need for OAuth |
| Deployment | Docker container on same VPS       | Joins `shared` network          |

---

## Features (MVP)

### Container Status Cards

Each service shows:

- Name, status (running/stopped/exited)
- Uptime, CPU %, memory usage
- Restart count
- Actions: **Restart**, **Stop**, **Start**

**Scope: all containers on the VPS** — not just sagepoint. The backend queries the Docker socket for every running container and groups them by compose project label (`com.docker.compose.project`) or by name prefix. This means nginx, any other apps, databases, and sagepoint all appear in the dashboard.

Known containers (sagepoint):

- `sagepoint_api`, `sagepoint_api_staging`
- `sagepoint_worker`, `sagepoint_worker_2`, `sagepoint_worker_staging`
- `sagepoint_postgres`, `sagepoint_redis`, `sagepoint_neo4j`

Unknown/other containers on the VPS (nginx, other projects, etc.) are shown in an **"Other"** group — still get status, logs, and restart actions, just no deep health checks.

### Health Checks

- **Redis**: PING via `ioredis`
- **Postgres**: simple `SELECT 1` via `pg`
- **Neo4j**: bolt ping via `neo4j-driver`
- **API endpoints**: HTTP GET to `/health` on prod and staging

### Log Tail

- Modal/drawer showing last N lines of container logs
- Uses `docker logs --tail 100 --follow` streamed via SSE or WebSocket

### Redis Queue Depth

- Show BullMQ queue lengths (waiting, active, failed) per queue
- Read directly from Redis keys

### Worker Scaling (nice to have)

- Button to bring `worker-2` up/down (runs `docker compose --profile scale up/down`)

---

## Backend API Routes

```
GET  /api/containers          — list all containers with status
POST /api/containers/:id/restart
POST /api/containers/:id/stop
POST /api/containers/:id/start
GET  /api/containers/:id/logs — SSE stream of logs
GET  /api/health/redis
GET  /api/health/postgres
GET  /api/health/neo4j
GET  /api/queues              — BullMQ queue depths
```

---

## Docker Setup (new project)

```yaml
# docker-compose.yml
services:
  dashboard:
    build: .
    container_name: sagepoint_dashboard
    restart: unless-stopped
    ports:
      - '127.0.0.1:3010:3010'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      DASHBOARD_TOKEN: ${DASHBOARD_TOKEN}
      REDIS_HOST: shared_redis
      POSTGRES_HOST: shared_postgres # or direct connection string
      NEO4J_URI: bolt://shared_neo4j:7687
    networks:
      - shared

networks:
  shared:
    external: true
```

nginx adds a `/dashboard` location or subdomain pointing to port 3010, protected by the Bearer token.

---

## Auth Strategy

Simple middleware: every request checks `Authorization: Bearer <DASHBOARD_TOKEN>`. Token set via env var. For the frontend, store token in `localStorage` after a login screen.

---

## Suggested Project Structure

```
sagepoint-dashboard/
├── server/
│   ├── index.js
│   ├── routes/
│   │   ├── containers.js   — docker socket calls
│   │   ├── health.js       — db pings
│   │   └── queues.js       — redis queue depths
│   └── middleware/
│       └── auth.js
├── client/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── ContainerCard.jsx
│   │   │   ├── HealthBadge.jsx
│   │   │   ├── LogDrawer.jsx
│   │   │   └── QueueStats.jsx
│   │   └── pages/
│   │       └── Dashboard.jsx
│   └── vite.config.js
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Open Questions / Decisions Needed

1. **Auth**: Bearer token sufficient, or want a proper login page with session?
2. **Log streaming**: SSE (simpler) or WebSocket (bidirectional)?
3. **Worker scaling**: include the start/stop `worker-2` button in MVP?
4. **Subdomain vs path**: `dash.yourdomain.com` or `yourdomain.com/dashboard`?
5. **Polling interval**: auto-refresh container status every N seconds, or manual refresh only?
