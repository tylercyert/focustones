#!/bin/bash

# Docker deployment script for Focustones
set -e

# Configuration
IMAGE_NAME="focustones"
CONTAINER_NAME="focustones-app"
PORT="3000"

echo "🐳 Deploying Focustones to Docker..."

# Build the production image
echo "🔨 Building Docker image..."
docker build -t $IMAGE_NAME:latest .

# Stop and remove existing container if running
echo "🛑 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run the new container
echo "🚀 Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:80 \
  --restart unless-stopped \
  $IMAGE_NAME:latest

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check container status
if docker ps | grep -q $CONTAINER_NAME; then
    echo "✅ Container is running!"
    echo "🌐 App available at: http://localhost:$PORT"
    echo "🔍 Container logs:"
    docker logs $CONTAINER_NAME --tail 10
else
    echo "❌ Container failed to start"
    docker logs $CONTAINER_NAME
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Useful commands:"
echo "  View logs: docker logs -f $CONTAINER_NAME"
echo "  Stop app: docker stop $CONTAINER_NAME"
echo "  Start app: docker start $CONTAINER_NAME"
echo "  Remove app: docker rm -f $CONTAINER_NAME"
