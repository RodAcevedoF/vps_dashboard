# VPS Dashboard - Next Steps

## ✅ Completed

- [x] Dashboard project initialized with React + TypeScript
- [x] Server-side Express API built with Docker integration
- [x] Dockerfile created with multi-stage build (bun-based)
- [x] GitHub Actions CI/CD pipeline configured
- [x] Successfully deployed to VPS at `/opt/vps_dashboard`
- [x] Docker container running on VPS (port 3010)
- [x] GitHub Container Registry integration working

## 🔧 Remaining: Backend Connection Setup

### 1. Configure Environment Variables on VPS

SSH into VPS and complete the `.env` file:

```bash
ssh projects-vps
cd /opt/vps_dashboard
nano .env
```

**Required values to add:**

| Variable | Current Value | Action Needed |
|----------|---------------|---------------|
| `DASHBOARD_TOKEN` | ✅ Auto-generated | Already set |
| `REDIS_HOST` | `shared_redis` | ✅ Correct |
| `REDIS_PORT` | `6379` | ✅ Correct |
| `POSTGRES_HOST` | Auto-detected | Verify container name |
| `POSTGRES_PASSWORD` | `REPLACE_PG_PASS` | ⚠️ **Add real password** |
| `POSTGRES_USER` | `postgres` | ✅ Likely correct |
| `POSTGRES_DB` | `postgres` | ✅ Likely correct |
| `DATABASE_URL` | Needs password | ⚠️ **Add real password** |
| `NEO4J_URI` | `bolt://shared_neo4j:7687` | ✅ Correct |
| `NEO4J_USER` | `neo4j` | ✅ Correct |
| `NEO4J_PASSWORD` | `REPLACE_NEO4J_PASS` | ⚠️ **Add real password** |
| `PROD_API_URL` | `http://sagepoint_api:3001` | ✅ Correct |
| `STAGING_API_URL` | `http://sagepoint_api_staging:3002` | ✅ Correct |

**Find missing passwords:**

```bash
# Check if you have docker-compose files with env vars
grep -r "NEO4J_PASSWORD" ~/*/docker-compose.yml 2>/dev/null
grep -r "POSTGRES_PASSWORD" ~/*/docker-compose.yml 2>/dev/null

# Or check running containers
docker inspect shared_neo4j | grep -A5 "Env"
docker inspect <postgres_container> | grep -A10 "Env"
```

### 2. Restart Dashboard Container

Once `.env` is complete:

```bash
cd /opt/vps_dashboard
docker compose down
docker compose up -d
docker compose logs -f
```

Verify it's running:
```bash
curl http://localhost:3010/health
```

Expected response:
```json
{"status":"ok","uptime":1.234}
```

### 3. Access Dashboard Locally via SSH Tunnel

From your Mac:

```bash
# Terminal 1 - SSH Tunnel
ssh -L 6379:shared_redis:6379 \
    -L 5432:<postgres_container>:5432 \
    -L 7687:shared_neo4j:7687 \
    -L 3001:sagepoint_api:3001 \
    -L 3002:sagepoint_api_staging:3002 \
    -L 3010:localhost:3010 \
    projects-vps -N
```

Then open: **http://localhost:3010**

Login with the `DASHBOARD_TOKEN` from the VPS `.env` file.

### 4. Test Dashboard Features

Once logged in, verify:

- [ ] **Containers page** shows all Docker containers
- [ ] **Health checks** work for:
  - [ ] Redis (shared_redis)
  - [ ] PostgreSQL
  - [ ] Neo4j (shared_neo4j)
  - [ ] Sagepoint API (prod)
  - [ ] Sagepoint API (staging)
- [ ] **Queue stats** display BullMQ queues from Redis
- [ ] **Container actions** (start/stop/restart) work
- [ ] **Log streaming** shows real-time container logs

### 5. Troubleshooting

**Dashboard won't start:**
```bash
cd /opt/vps_dashboard
docker compose logs
```

**Can't connect to databases:**
- Check if containers are on `shared` network:
  ```bash
  docker network inspect shared
  ```
- Verify `.env` credentials match container configs

**Health checks fail:**
- Test connections manually:
  ```bash
  docker exec -it shared_redis redis-cli ping
  docker exec -it <postgres> psql -U postgres -c "SELECT 1"
  docker exec -it shared_neo4j cypher-shell -u neo4j -p <password> "RETURN 1"
  ```

**Authentication fails:**
- Regenerate dashboard token:
  ```bash
  cd /opt/vps_dashboard
  openssl rand -hex 32
  # Update .env with new token
  docker compose restart
  ```

## 🚀 Future Enhancements

- [ ] Set up Nginx reverse proxy with SSL (Let's Encrypt)
- [ ] Add Grafana/Prometheus monitoring integration
- [ ] Implement user authentication (OAuth/JWT)
- [ ] Add email/Slack notifications for container failures
- [ ] Create backup/restore functionality
- [ ] Add resource usage alerts (CPU/Memory thresholds)

## 📝 Important Notes

### Security
- Dashboard is currently bound to `127.0.0.1:3010` (localhost only) - ✅ Secure
- Token-based authentication is enabled
- All API endpoints require Bearer token
- Database passwords are in `.env` (gitignored) - ✅ Not in repo

### Deployment
- Push to `master` branch triggers auto-deployment via GitHub Actions
- Docker image is built and pushed to GHCR
- VPS pulls latest image and restarts container automatically

### Local Development
To run dashboard locally while connected to VPS:

```bash
# Terminal 1 - SSH tunnel (see step 3)
ssh -L ... projects-vps -N

# Terminal 2 - Local .env
cat > .env << 'EOF'
DASHBOARD_TOKEN=<same-as-vps>
REDIS_HOST=localhost
REDIS_PORT=6379
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/postgres
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=<password>
POSTGRES_DB=postgres
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=<password>
PROD_API_URL=http://localhost:3001
STAGING_API_URL=http://localhost:3002
PORT=3010
NODE_ENV=development
EOF

# Terminal 3 - Run backend
bun run dev:server

# Terminal 4 - Run frontend
bun run dev
```

Visit: http://localhost:3000

## 📞 Support

- Repository: https://github.com/RodAcevedoF/vps_dashboard
- GitHub Actions: https://github.com/RodAcevedoF/vps_dashboard/actions
- Container Registry: https://github.com/users/RodAcevedoF/packages/container/package/vps_dashboard

---

**Last Updated:** 2026-04-22
**Status:** Backend connection pending - requires .env completion on VPS
