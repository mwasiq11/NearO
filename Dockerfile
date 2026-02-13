# Root Dockerfile for Railway - Backend Service
# Multi-stage build for optimized production image

FROM node:22-alpine

WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    curl \
    bash \
    mysql-client

# Copy package files
COPY backend/package*.json ./

# Install npm dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy backend source code
COPY backend/src ./src

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000

# Health check to verify the app is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Start the Node.js application
CMD ["node", "src/app.js"]
