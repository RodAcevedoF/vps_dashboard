# Deployment Guide

## Automated Deployment with GitHub Actions

This project uses GitHub Actions to automatically build and deploy the dashboard to your VPS whenever you push to the `main` branch.

### Setup Instructions

#### 1. Configure GitHub Container Registry

Update your `docker-compose.yml` to use the GHCR image:

```yaml
services:
  dashboard:
    image: ghcr.io/YOUR_GITHUB_USERNAME/vps_dashboard:latest
    # ... rest of config
```

#### 2. Set Up GitHub Secrets

Go to your repository settings → Secrets and variables → Actions, and add the following secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `VPS_HOST` | Your VPS IP address or hostname | `123.45.67.89` |
| `VPS_USERNAME` | SSH username on VPS | `ubuntu` or `root` |
| `VPS_SSH_KEY` | Private SSH key for VPS access | Contents of `~/.ssh/id_rsa` |
| `VPS_PORT` | SSH port (optional, defaults to 22) | `22` |

**Getting your SSH key:**
```bash
cat ~/.ssh/id_rsa
```

Copy the entire output including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`.

#### 3. Prepare VPS

SSH into your VPS and set up the project directory:

```bash
ssh projects-vps

# Create project directory
sudo mkdir -p /opt/vps_dashboard
sudo chown $USER:$USER /opt/vps_dashboard
cd /opt/vps_dashboard

# Clone repository (first time only)
git clone https://github.com/YOUR_USERNAME/vps_dashboard.git .

# Create .env file
cp .env.example .env
nano .env  # Add your actual values

# Ensure shared network exists
docker network create shared || true

# Create initial docker-compose.yml that uses GHCR image
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  dashboard:
    image: ghcr.io/YOUR_USERNAME/vps_dashboard:latest
    container_name: sagepoint_dashboard
    restart: unless-stopped
    ports:
      - '127.0.0.1:3010:3010'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    env_file:
      - .env
    networks:
      - shared
    healthcheck:
      test: ['CMD', 'node', '-e', "require('http').get('http://localhost:3010/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

networks:
  shared:
    external: true
EOF
```

#### 4. Make Repository Public or Configure Package Access

**Option A: Public Repository** (Easiest)
- Go to repository Settings → Danger Zone → Change visibility → Make public

**Option B: Private Repository with Package Access**
1. Go to your GitHub profile → Packages
2. Find the `vps_dashboard` package
3. Click "Package settings"
4. Under "Manage Actions access", add your VPS as an authorized user
5. Create a Personal Access Token (PAT) with `read:packages` scope
6. On VPS, login with PAT:
   ```bash
   echo "YOUR_PAT" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

### Deployment Workflow

Once configured, deployment is automatic:

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "Update dashboard"
   git push origin main
   ```

2. **GitHub Actions will:**
   - Build the Docker image
   - Push to GitHub Container Registry
   - SSH into your VPS
   - Pull the latest image
   - Restart the container

3. **Monitor deployment:**
   - Go to your repository → Actions tab
   - Click on the latest workflow run
   - Watch the deployment progress

### Manual Deployment

If you need to deploy manually:

```bash
# Trigger workflow manually
# Go to Actions → Deploy to VPS → Run workflow

# Or deploy via SSH
ssh projects-vps "cd /opt/vps_dashboard && docker compose pull && docker compose up -d"
```

### Rollback

To rollback to a previous version:

```bash
ssh projects-vps

cd /opt/vps_dashboard

# Pull specific version by SHA
docker pull ghcr.io/YOUR_USERNAME/vps_dashboard:main-abc1234

# Update docker-compose.yml to use that tag
# Then restart
docker compose up -d
```

### Troubleshooting

**Build fails:**
- Check Actions logs for errors
- Ensure all TypeScript files compile locally: `npm run build`

**Deployment fails:**
- Verify SSH secrets are correct
- Check VPS has enough disk space: `ssh projects-vps "df -h"`
- Ensure Docker daemon is running: `ssh projects-vps "docker ps"`

**Container won't start:**
- Check logs: `ssh projects-vps "cd /opt/vps_dashboard && docker compose logs"`
- Verify .env file has all required values
- Check Docker socket permissions

**Image pull fails:**
- If private repo, ensure PAT is configured on VPS
- Check package visibility settings
- Try manual login: `ssh projects-vps` then `docker login ghcr.io`

### Local Development

For local development without Docker:

```bash
# Install dependencies
npm install

# Run frontend dev server
npm run dev

# In another terminal, run backend
npm run dev:server
```

For local testing with Docker:

```bash
# Build image
docker compose build

# Run locally
docker compose up
```
