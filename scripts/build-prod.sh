#!/bin/bash

# Production build script for Focustones
set -e

echo "🚀 Building Focustones for production..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist
rm -rf node_modules

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type check
echo "🔍 Running TypeScript check..."
npm run build

# Check build output
if [ -d "dist" ]; then
    echo "✅ Build successful! Build output:"
    ls -la dist/
    echo ""
    echo "📊 Build size:"
    du -sh dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 Production build completed successfully!"
echo "🐳 Ready for Docker deployment!"
