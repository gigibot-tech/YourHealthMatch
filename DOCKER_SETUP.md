# Docker Setup Guide

Complete guide for running the telemedicine backend API with Docker.

## 🐳 Quick Start

```bash
# 1. Navigate to project
cd telemedicine-video-app

# 2. Configure environment
cp .env.example .env
# Edit .env with your Agora credentials

# 3. Start backend with Docker
docker-compose up
```

Backend will be available at `http://localhost:3000`

---

## 📋 Prerequisites

- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))
- Agora.io account with App ID and Certificate
- Basic terminal/command line knowledge

---

## 🔧 Configuration

### 1. Environment Variables

Create `.env` file in project root:

```bash
# Agora Configuration (REQUIRED)
AGORA_APP_ID=your_agora_app_id_here
AGORA_APP_CERTIFICATE=your_agora_certificate_here

# Backend Configuration
NODE_ENV=development
PORT=3000
TOKEN_EXPIRY_SECONDS=3600

# Optional: Database (if using PostgreSQL)
# DB_PASSWORD=your_secure_password
```

### 2. Get Agora Credentials

1. Sign up at https://console.agora.io
2. Create a new project
3. Get your App ID
4. Enable App Certificate
5. Copy both to `.env` file

---

## 🚀 Docker Commands

### Start Services

```bash
# Start in foreground (see logs)
docker-compose up

# Start in background
docker-compose up -d

# Start and rebuild
docker-compose up --build
```

### Stop Services

```bash
# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop and remove everything
docker-compose down --rmi all -v
```

### View Logs

```bash
# All services
docker-compose logs

# Follow logs (live)
docker-compose logs -f

# Specific service
docker-compose logs api

# Last 100 lines
docker-compose logs --tail=100
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart api
```

---

## 🧪 Testing the Backend

### 1. Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 123.456
}
```

### 2. Generate Token

```bash
curl -X POST http://localhost:3000/api/video/token \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123",
    "channelName": "test_channel",
    "uid": 1
  }'
```

Expected response:
```json
{
  "token": "006abc123...",
  "channelName": "test_channel",
  "uid": 1,
  "expiresAt": "2024-01-01T13:00:00.000Z",
  "appId": "your_app_id"
}
```

### 3. Start Session

```bash
curl -X POST http://localhost:3000/api/video/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "appointmentId": "test_123"
  }'
```

### 4. List Sessions

```bash
curl http://localhost:3000/api/video/sessions
```

---

## 📁 Project Structure

```
telemedicine-video-app/
├── docker-compose.yml          # Docker Compose configuration
├── .env                        # Environment variables (create this)
├── .env.example               # Environment template
└── backend/
    ├── Dockerfile             # Docker image definition
    ├── package.json           # Node.js dependencies
    ├── server.js              # Express server
    └── healthcheck.js         # Health check script
```

---

## 🔍 Troubleshooting

### Issue: "Cannot connect to backend"

**Check if container is running:**
```bash
docker-compose ps
```

**Check logs:**
```bash
docker-compose logs api
```

**Restart services:**
```bash
docker-compose restart
```

### Issue: "Agora credentials not configured"

**Solution:**
1. Check `.env` file exists
2. Verify `AGORA_APP_ID` and `AGORA_APP_CERTIFICATE` are set
3. Restart Docker: `docker-compose restart`

### Issue: "Port 3000 already in use"

**Solution 1 - Change port:**
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Use port 3001 instead
```

**Solution 2 - Stop conflicting service:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Issue: "Cannot build image"

**Solution:**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild
docker-compose up --build
```

---

## 🔒 Security Best Practices

### 1. Environment Variables

✅ **DO:**
- Use `.env` file for secrets
- Add `.env` to `.gitignore`
- Use different credentials for dev/prod

❌ **DON'T:**
- Commit `.env` to git
- Hardcode credentials in code
- Share credentials in plain text

### 2. Production Deployment

For production, use:
- Environment variables from hosting platform
- Secrets management (AWS Secrets Manager, etc.)
- HTTPS/TLS encryption
- Rate limiting
- Authentication

---

## 📊 Monitoring

### Container Stats

```bash
# Real-time stats
docker stats

# Specific container
docker stats telemedicine-api
```

### Container Logs

```bash
# Last 100 lines
docker-compose logs --tail=100 api

# Follow logs
docker-compose logs -f api

# Since specific time
docker-compose logs --since 2024-01-01T12:00:00 api
```

### Health Checks

Docker automatically runs health checks every 30 seconds:

```bash
# Check health status
docker inspect telemedicine-api | grep Health -A 10
```

---

## 🚀 Production Deployment

### Option 1: Docker Hub

```bash
# Build image
docker build -t yourusername/telemedicine-api:latest ./backend

# Push to Docker Hub
docker push yourusername/telemedicine-api:latest

# Deploy on server
docker pull yourusername/telemedicine-api:latest
docker run -d -p 3000:3000 \
  -e AGORA_APP_ID=xxx \
  -e AGORA_APP_CERTIFICATE=xxx \
  yourusername/telemedicine-api:latest
```

### Option 2: AWS ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name telemedicine-api

# Build and push
docker build -t telemedicine-api ./backend
docker tag telemedicine-api:latest xxx.dkr.ecr.region.amazonaws.com/telemedicine-api:latest
docker push xxx.dkr.ecr.region.amazonaws.com/telemedicine-api:latest

# Deploy to ECS (use AWS Console or CLI)
```

### Option 3: Google Cloud Run

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/telemedicine-api
gcloud run deploy telemedicine-api \
  --image gcr.io/PROJECT_ID/telemedicine-api \
  --platform managed \
  --set-env-vars AGORA_APP_ID=xxx,AGORA_APP_CERTIFICATE=xxx
```

### Option 4: Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create telemedicine-api

# Set environment variables
heroku config:set AGORA_APP_ID=xxx
heroku config:set AGORA_APP_CERTIFICATE=xxx

# Deploy
heroku container:push web
heroku container:release web
```

---

## 🔄 Development Workflow

### 1. Local Development

```bash
# Start backend
docker-compose up

# Make code changes in backend/server.js
# Container auto-restarts (if using nodemon)

# View logs
docker-compose logs -f api
```

### 2. Testing Changes

```bash
# Rebuild after changes
docker-compose up --build

# Or restart specific service
docker-compose restart api
```

### 3. Debugging

```bash
# Access container shell
docker-compose exec api sh

# Check environment variables
docker-compose exec api env

# Check files
docker-compose exec api ls -la
```

---

## 📈 Scaling

### Horizontal Scaling

```yaml
# docker-compose.yml
services:
  api:
    # ... existing config
    deploy:
      replicas: 3  # Run 3 instances
```

### Load Balancing

Use nginx or cloud load balancer:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api

  api:
    # ... existing config
    deploy:
      replicas: 3
```

---

## 🧹 Cleanup

### Remove Containers

```bash
# Stop and remove containers
docker-compose down

# Remove volumes too
docker-compose down -v
```

### Clean Docker System

```bash
# Remove unused containers, networks, images
docker system prune

# Remove everything (careful!)
docker system prune -a --volumes
```

---

## 📝 Useful Commands Cheatsheet

```bash
# Start
docker-compose up                    # Start in foreground
docker-compose up -d                 # Start in background
docker-compose up --build            # Rebuild and start

# Stop
docker-compose down                  # Stop and remove containers
docker-compose stop                  # Stop without removing

# Logs
docker-compose logs                  # View all logs
docker-compose logs -f               # Follow logs
docker-compose logs api              # Specific service

# Status
docker-compose ps                    # List containers
docker stats                         # Resource usage

# Execute
docker-compose exec api sh           # Access container shell
docker-compose exec api env          # View environment

# Restart
docker-compose restart               # Restart all
docker-compose restart api           # Restart specific

# Clean
docker-compose down -v               # Remove with volumes
docker system prune                  # Clean unused resources
```

---

## 🎯 Next Steps

1. ✅ Start backend with Docker
2. ✅ Test token generation
3. ✅ Configure mobile app to use backend
4. ✅ Test video call between two devices
5. 🚀 Deploy to production

---

## 💡 Tips

- Use `docker-compose logs -f` to debug issues
- Check `.env` file if credentials don't work
- Use `docker-compose restart` after changing `.env`
- Monitor container health with `docker stats`
- Keep Docker Desktop running while developing

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Agora Token Server](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

**Need help? Check the logs first: `docker-compose logs -f api`**