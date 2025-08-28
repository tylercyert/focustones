# 🐳 Focustones Docker Deployment Guide

This guide covers deploying the Focustones binaural beat generator app using Docker.

## 📋 Prerequisites

- Docker installed and running
- Docker Compose (optional, for easier management)
- At least 2GB of available RAM
- Port 3000 available (configurable)

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start the app
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the app
docker-compose down
```

### Option 2: Using Docker Commands

```bash
# Build the image
docker build -t focustones:latest .

# Run the container
docker run -d \
  --name focustones-app \
  -p 3000:80 \
  --restart unless-stopped \
  focustones:latest
```

### Option 3: Using Deployment Scripts

```bash
# Build for production
./scripts/build-prod.sh

# Deploy to Docker
./scripts/deploy.sh
```

## 🌐 Accessing the App

Once deployed, the app will be available at:
- **Local**: http://localhost:3000
- **Network**: http://your-server-ip:3000

## 🔧 Configuration

### Environment Variables

The app can be configured using environment variables:

```bash
# In docker-compose.yml or docker run command
environment:
  - NODE_ENV=production
  - PORT=80
```

### Port Configuration

To change the external port, modify the port mapping:

```yaml
# In docker-compose.yml
ports:
  - "8080:80"  # External:Internal
```

```bash
# In docker run command
-p 8080:80
```

## 📊 Monitoring & Health Checks

### Health Check Endpoint

The app includes a health check endpoint:
- **URL**: `/health`
- **Response**: `healthy` (200 OK)

### Container Status

```bash
# Check container status
docker ps

# View container logs
docker logs -f focustones-app

# Check resource usage
docker stats focustones-app
```

## 🛠️ Maintenance

### Updating the App

```bash
# Pull latest code
git pull origin main

# Rebuild and redeploy
./scripts/deploy.sh
```

### Backup & Restore

```bash
# Backup container
docker export focustones-app > focustones-backup.tar

# Restore container
docker import focustones-backup.tar focustones:backup
```

### Logs Management

```bash
# View recent logs
docker logs --tail 100 focustones-app

# Follow logs in real-time
docker logs -f focustones-app

# Clear logs (if needed)
docker exec focustones-app truncate -s 0 /var/log/nginx/*.log
```

## 🔒 Security Considerations

### Network Security

- The app runs on port 80 internally (HTTP)
- Consider using a reverse proxy (nginx, traefik) for HTTPS
- Use Docker networks to isolate containers

### Security Headers

The nginx configuration includes security headers:
- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## 📈 Performance Optimization

### Nginx Configuration

The nginx configuration includes:
- Gzip compression for text assets
- Static asset caching (1 year)
- Sendfile optimization
- Keep-alive connections

### Resource Limits

Consider adding resource limits:

```yaml
# In docker-compose.yml
services:
  focustones:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

## 🐛 Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check container logs
docker logs focustones-app

# Check if port is in use
lsof -i :3000

# Verify Docker is running
docker info
```

#### Build Failures

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t focustones:latest .
```

#### Performance Issues

```bash
# Check resource usage
docker stats focustones-app

# Monitor nginx logs
docker exec focustones-app tail -f /var/log/nginx/access.log
```

### Debug Mode

To run in debug mode:

```bash
# Build with debug info
docker build --build-arg NODE_ENV=development -t focustones:debug .

# Run with debug logging
docker run -e NODE_ENV=development focustones:debug
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [React Production Build](https://create-react-app.dev/docs/production-build/)

## 🤝 Support

For deployment issues:
1. Check the troubleshooting section above
2. Review container logs: `docker logs focustones-app`
3. Verify Docker and system requirements
4. Check port availability and firewall settings

---

**Happy Deploying! 🎉**
