# VPS Dashboard Setup Guide

A lightweight operations dashboard for managing Docker containers, health checks, and queue monitoring on your VPS.

## Prerequisites

- Node.js 20+ installed
- Docker and Docker Compose (for production deployment)
- Access to Docker socket (`/var/run/docker.sock`)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- Set a secure `DASHBOARD_TOKEN` for authentication
- Update database connection strings
- Configure API endpoints

### 3. Development

Run the frontend and backend separately in development:

**Terminal 1 - Frontend (Rsbuild dev server):**
```bash
npm run dev
```

**Terminal 2 - Backend (Express server):**
```bash
npm run dev:server
```

The frontend will be available at `http://localhost:3000` (or configured Rsbuild port).
The backend API will run on `http://localhost:3010`.

## Production Deployment

### Build and Deploy with Docker

1. Build the Docker image:
```bash
docker compose build
```

2. Start the dashboard:
```bash
docker compose up -d
```

The dashboard will be available on `http://localhost:3010`.

### Docker Socket Access

The dashboard requires read access to the Docker socket to manage containers. The `docker-compose.yml` mounts `/var/run/docker.sock` as read-only.

**Security Note**: Only run this on trusted internal networks. The Docker socket provides significant system access.

### Joining the Shared Network

The dashboard joins the `shared` Docker network to communicate with your other containers (Redis, PostgreSQL, Neo4j, APIs). Ensure this network exists:

```bash
docker network create shared
```

### Nginx Configuration

Add a location block to your nginx config to proxy the dashboard:

```nginx
location /dashboard {
    proxy_pass http://127.0.0.1:3010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

Or use a subdomain:

```nginx
server {
    listen 80;
    server_name dash.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Features

### Container Management
- View all Docker containers on the VPS
- Real-time CPU and memory stats for running containers
- Start, stop, and restart containers
- Stream container logs in real-time

### Health Monitoring
- Redis health checks (PING)
- PostgreSQL connectivity tests
- Neo4j bolt connection checks
- API endpoint health verification

### Queue Monitoring
- BullMQ queue depth statistics
- Track waiting, active, completed, failed, and delayed jobs
- Multiple queue support

## Security

### Authentication
The dashboard uses Bearer token authentication. All API routes (except `/api/auth/login`) require the `Authorization: Bearer <token>` header.

The token is stored in `localStorage` on the frontend after successful login.

### Best Practices
- Use a strong, randomly generated `DASHBOARD_TOKEN`
- Only expose the dashboard on internal networks or behind VPN
- Consider adding IP allowlisting in nginx
- Regularly rotate the dashboard token

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with token

### Containers
- `GET /api/containers` - List all containers with stats
- `POST /api/containers/:id/start` - Start a container
- `POST /api/containers/:id/stop` - Stop a container
- `POST /api/containers/:id/restart` - Restart a container
- `GET /api/containers/:id/logs` - Stream container logs (SSE)

### Health
- `GET /api/health/redis` - Redis health check
- `GET /api/health/postgres` - PostgreSQL health check
- `GET /api/health/neo4j` - Neo4j health check
- `GET /api/health/api/:env` - API health check (prod/staging)

### Queues
- `GET /api/queues` - Get BullMQ queue statistics

## Project Structure

```
vps_dashboard/
├── server/               # Backend Express server
│   ├── index.js         # Main server entry point
│   ├── middleware/      # Auth middleware
│   ├── routes/          # API route handlers
│   │   ├── containers.js
│   │   ├── health.js
│   │   └── queues.js
│   └── utils/           # Docker client utilities
│       └── docker.js
├── src/                 # Frontend React app
│   ├── components/      # React components
│   │   ├── ContainerCard.tsx
│   │   ├── HealthBadge.tsx
│   │   ├── LogDrawer.tsx
│   │   └── QueueStats.tsx
│   ├── pages/           # Page components
│   │   ├── Dashboard.tsx
│   │   └── Login.tsx
│   ├── lib/             # API client
│   │   └── api.ts
│   ├── types/           # TypeScript types
│   │   └── index.ts
│   ├── App.tsx          # Root component
│   └── index.tsx        # Entry point
├── Dockerfile           # Multi-stage production build
├── docker-compose.yml   # Docker Compose config
└── .env.example         # Environment template
```

## Troubleshooting

### Docker Socket Permission Denied
If you get permission errors accessing the Docker socket, ensure the user running the container has access to `/var/run/docker.sock`.

### Health Checks Failing
- Verify container names in your `.env` match actual container names
- Check that the dashboard container is on the `shared` network
- Ensure Redis, PostgreSQL, and Neo4j are accepting connections

### Logs Not Streaming
The log streaming uses Server-Sent Events (SSE). Ensure your proxy (nginx) doesn't buffer SSE responses:
```nginx
proxy_buffering off;
proxy_cache off;
```

## Development Notes

- Frontend uses Rsbuild (fast Rspack-based build tool)
- Styling with Tailwind CSS v4
- Testing with RSTest (React + Happy DOM)
- Code formatting with Biome

## License

Private project for VPS management.
