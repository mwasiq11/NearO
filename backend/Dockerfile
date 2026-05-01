# Stage 1: Build & Dependencies
FROM node:22-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules (like bcrypt)
RUN apk add --no-cache python3 make g++

# Copy package files first for better layer caching
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev)
RUN npm ci

# Generate Prisma Client (crucial for Prisma to work in container)
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Prune devDependencies to keep the production image small
RUN npm prune --omit=dev

# Stage 2: Runtime
FROM node:22-alpine AS runtime

WORKDIR /app

# Install runtime system tools
RUN apk add --no-cache mysql-client bash curl

# Create a non-root user for security
RUN addgroup -S app && adduser -S app -G app

# Copy pruned application from builder stage
# We use --chown to ensure the app user owns the files
COPY --from=builder --chown=app:app /app /app

# Ensure entrypoint scripts are executable
RUN chmod +x entrypoint.sh wait-for-mysql.sh

# Switch to non-root user
USER app

# Expose the application port
EXPOSE 3000

# Health check to support auto-scaling and high availability
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["./entrypoint.sh"]


