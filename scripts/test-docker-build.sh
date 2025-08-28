#!/bin/bash

# Test Docker Build Script for FocusTones.co
# This script tests the Docker build process to ensure it works correctly

set -e  # Exit on any error

echo "🐳 Testing Docker build for FocusTones.co..."
echo "=============================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

echo "✅ Docker is available"

# Clean up any existing test images
echo "🧹 Cleaning up existing test images..."
docker rmi focustones:test 2>/dev/null || true

# Build the test image
echo "🔨 Building Docker image..."
docker build -t focustones:test .

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Docker build successful!"
    
    # Test running the container
    echo "🚀 Testing container startup..."
    docker run --rm -d --name focustones-test -p 3001:80 focustones:test
    
    # Wait a moment for nginx to start
    sleep 3
    
    # Test health endpoint
    echo "🏥 Testing health endpoint..."
    if curl -f http://localhost:3001/health >/dev/null 2>&1; then
        echo "✅ Health check passed!"
    else
        echo "❌ Health check failed"
    fi
    
    # Test main page
    echo "🌐 Testing main page..."
    if curl -f http://localhost:3001/ >/dev/null 2>&1; then
        echo "✅ Main page accessible!"
    else
        echo "❌ Main page not accessible"
    fi
    
    # Clean up test container
    echo "🧹 Cleaning up test container..."
    docker stop focustones-test 2>/dev/null || true
    docker rm focustones-test 2>/dev/null || true
    
    echo "🎉 All tests passed! Docker build is ready for production."
else
    echo "❌ Docker build failed!"
    exit 1
fi
