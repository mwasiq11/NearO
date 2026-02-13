# Root Dockerfile for Railway - routes to backend
# Railway detects and uses this automatically

FROM node:22-alpine AS dependencies

WORKDIR /app

COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Production stage
FROM node:22-alpine

RUN apk add --no-cache curl tini

WORKDIR /app

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy application code from backend
COPY backend/src ./src
COPY backend/package*.json ./
COPY backend/entrypoint.sh backend/wait-for-mysql.sh ./

# Make scripts executable
RUN chmod +x entrypoint.sh wait-for-mysql.sh

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["./entrypoint.sh"]
