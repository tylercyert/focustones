# Multi-stage build for production
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci --verbose

# Verify npm and node are available
RUN npm --version && node --version

# Copy source code
COPY . .

# Debug: Show what files we have
RUN ls -la

# Debug: Show package.json contents
RUN cat package.json

# Build the app with explicit error handling
RUN npm run build

# Verify build output exists
RUN ls -la dist/

# Production stage
FROM nginx:alpine AS production

# Copy built app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Verify files were copied correctly
RUN ls -la /usr/share/nginx/html/

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
