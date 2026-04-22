# VPS Dashboard - Project Summary

## Overview

A lightweight, purpose-built operations dashboard for managing Docker containers, monitoring infrastructure health, and tracking job queues on a VPS running the Sagepoint application stack.

## Technology Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Rsbuild (Rspack-based, fast builds)
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks (useState, useEffect)
- **API Communication**: Fetch API with SSE for log streaming

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js with TypeScript
- **Docker Integration**: Dockerode (Docker Engine API client)
- **Database Clients**:
  - Redis (`redis` package)
  - PostgreSQL (`pg` package)
  - Neo4j (`neo4j-driver` package)

### DevOps
- **Containerization**: Docker with multi-stage builds
- **CI/CD**: GitHub Actions
- **Registry**: GitHub Container Registry (GHCR)
- **Development**: tsx for TypeScript hot reload

### Code Quality
- **Linting/Formatting**: Biome
- **Testing**: RSTest with Happy DOM
- **Type Checking**: TypeScript 5.9

## Core Features

### 1. Container Management
- **List All Containers**: Shows all Docker containers on the VPS (not just Sagepoint)
- **Real-time Stats**: CPU and memory usage for running containers
- **Container Controls**: Start, stop, restart actions
- **Live Logs**: Server-Sent Events (SSE) streaming of container logs
- **Grouping**: Automatically groups containers (Sagepoint vs Others)

### 2. Infrastructure Health Monitoring
- **Redis**: Ping-based health check
- **PostgreSQL**: Connection and query test (`SELECT 1`)
- **Neo4j**: Bolt connection health check
- **API Endpoints**: Health checks for production and staging APIs
- **Visual Indicators**: Color-coded health badges (green/red)

### 3. Queue Monitoring
- **BullMQ Integration**: Tracks job queue statistics from Redis
- **Metrics Tracked**: Waiting, active, completed, failed, delayed jobs
- **Multi-Queue Support**: Displays all queues in the system

### 4. Security
- **Authentication**: Bearer token-based auth
- **Token Storage**: localStorage on frontend
- **Protected Routes**: All API endpoints require authentication
- **Docker Socket**: Read-only mount for container management

## Architecture

### Frontend Structure
```
src/
├── components/
│   ├── ContainerCard.tsx      # Container status and controls
│   ├── HealthBadge.tsx         # Health status indicator
│   ├── LogDrawer.tsx           # Real-time log viewer modal
│   └── QueueStats.tsx          # Queue metrics display
├── pages/
│   ├── Dashboard.tsx           # Main dashboard page
│   └── Login.tsx               # Token authentication
├── lib/
│   └── api.ts                  # API client with auth handling
└── types/
    └── index.ts                # TypeScript interfaces
```

### Backend Structure
```
server/
├── index.ts                    # Express server entry point
├── middleware/
│   └── auth.ts                 # Bearer token middleware
├── routes/
│   ├── containers.ts           # Docker container endpoints
│   ├── health.ts               # Health check endpoints
│   └── queues.ts               # BullMQ queue endpoints
└── utils/
    └── docker.ts               # Docker client utilities
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with token

### Containers
- `GET /api/containers` - List all containers with stats
- `POST /api/containers/:id/start` - Start container
- `POST /api/containers/:id/stop` - Stop container
- `POST /api/containers/:id/restart` - Restart container
- `GET /api/containers/:id/logs` - Stream logs (SSE)

### Health Checks
- `GET /api/health/redis` - Redis health
- `GET /api/health/postgres` - PostgreSQL health
- `GET /api/health/neo4j` - Neo4j health
- `GET /api/health/api/:env` - API health (prod/staging)

### Queues
- `GET /api/queues` - BullMQ queue statistics

## Deployment

### GitHub Actions Workflow
1. **Trigger**: Push to `main` branch or manual dispatch
2. **Build**: Multi-stage Docker build (frontend + backend)
3. **Push**: Image to GitHub Container Registry
4. **Deploy**: SSH to VPS, pull image, restart container
5. **Cleanup**: Remove old images

### VPS Setup
- **Location**: `/opt/vps_dashboard`
- **Network**: Joins `shared` Docker network
- **Port**: Exposed on `127.0.0.1:3010`
- **Reverse Proxy**: nginx routes `/dashboard` to the app
- **Docker Socket**: Mounted read-only for container access

### Environment Variables
```bash
# Authentication
DASHBOARD_TOKEN=<secret-token>

# Redis
REDIS_HOST=sagepoint_redis
REDIS_PORT=6379

# PostgreSQL
DATABASE_URL=postgresql://...
POSTGRES_HOST=sagepoint_postgres
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password>
POSTGRES_DB=postgres

# Neo4j
NEO4J_URI=bolt://sagepoint_neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>

# APIs
PROD_API_URL=http://sagepoint_api:3001
STAGING_API_URL=http://sagepoint_api_staging:3002

# Server
PORT=3010
NODE_ENV=production
```

## Development Workflow

### Local Development
```bash
# Install dependencies
bun install

# Run frontend (port 3000)
bun run dev

# Run backend with hot reload (port 3010)
bun run dev:server
```

### Building
```bash
# Build both frontend and backend
bun run build

# Build separately
bun run build:client  # Frontend → dist/
bun run build:server  # Backend → dist-server/
```

### Production
```bash
# Start compiled server
bun run start

# Or with Docker
docker compose up -d
```

## Key Design Decisions

### Why Not Portainer?
- **Too Generic**: Portainer is a general-purpose container manager
- **Heavyweight**: More features than needed for this specific use case
- **Customization**: Custom dashboard allows purpose-built features (queue monitoring, specific health checks)
- **Simplicity**: Lighter weight and faster for VPS environment

### Why TypeScript?
- **Type Safety**: Catch errors at compile time
- **Better DX**: Autocomplete and IntelliSense
- **Maintainability**: Self-documenting code with type annotations
- **Scalability**: Easier to refactor and extend

### Why Rsbuild?
- **Performance**: Rspack-based, significantly faster than Webpack
- **Modern**: Built for modern React development
- **Simple Config**: Minimal configuration needed
- **Tree Shaking**: Smaller bundle sizes

### Why SSE for Logs?
- **Simpler**: No WebSocket server needed
- **Unidirectional**: Logs only flow server → client
- **HTTP/2 Friendly**: Works well with existing infrastructure
- **Auto-Reconnect**: Built-in reconnection handling

## Project Metrics

- **Total Files**: ~25 source files
- **Backend Routes**: 3 routers, 12 endpoints
- **Frontend Components**: 4 components, 2 pages
- **Build Time**: ~5-10 seconds (Rsbuild)
- **Docker Image Size**: ~200-300 MB (multi-stage build)
- **Dependencies**: 6 runtime, 13 dev dependencies

## Future Enhancements (Optional)

### Potential Features
- **Worker Scaling**: Button to scale `worker-2` up/down
- **Metrics History**: Chart CPU/memory over time
- **Alerts**: Email/Slack notifications for unhealthy services
- **Container Actions**: More controls (pause, kill, remove)
- **Bulk Operations**: Select multiple containers for actions
- **Log Filtering**: Search and filter container logs
- **Themes**: Dark/light mode toggle
- **User Management**: Multiple users with different access levels

### Technical Improvements
- **WebSocket Alternative**: Consider for bidirectional features
- **Caching**: Redis cache for container stats
- **Rate Limiting**: Prevent API abuse
- **Monitoring**: Prometheus/Grafana integration
- **Backup/Restore**: Configuration backup feature

## Documentation

- **[SETUP.md](SETUP.md)** - Complete setup and usage guide
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - CI/CD and deployment instructions
- **[INIT.md](INIT.md)** - Original project planning and requirements

## License

Private project for VPS infrastructure management.

---

**Built with ❤️ for Sagepoint VPS Infrastructure**

Last Updated: 2026-04-22
