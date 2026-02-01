#!/bin/bash
# docker-build-and-run.sh - Complete Docker setup script

set -e

echo "=========================================="
echo "🐳 NearO Docker Build & Run Script"
echo "=========================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

echo "✓ Docker is running"
echo ""

# Cleanup old containers and volumes
echo "🧹 Cleaning up old containers and volumes..."
docker-compose down -v 2>/dev/null || true
echo "✓ Cleanup complete"
echo ""

# Build images
echo "🔨 Building Docker images..."
docker-compose build --no-cache
echo "✓ Images built successfully"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d
echo "✓ Services started"
echo ""

# Wait for MySQL to be healthy
echo "⏳ Waiting for MySQL to be healthy..."
max_attempts=60
attempt=0
while [ $attempt -lt $max_attempts ]; do
  if docker-compose ps mysql | grep -q "healthy"; then
    echo "✓ MySQL is healthy"
    break
  fi
  attempt=$((attempt + 1))
  echo "  Attempt $attempt/$max_attempts..."
  sleep 1
done

if [ $attempt -ge $max_attempts ]; then
  echo "⚠️ MySQL didn't become healthy, but continuing..."
fi

echo ""
echo "=========================================="
echo "✅ Docker setup complete!"
echo "=========================================="
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔗 Access points:"
echo "  Frontend: http://localhost:8080"
echo "  API:      http://localhost:3000"
echo "  MySQL:    localhost:3306"
echo "  Redis:    localhost:6379"
echo ""
echo "📋 Common commands:"
echo "  View logs:         docker-compose logs -f"
echo "  View API logs:     docker-compose logs -f api"
echo "  Stop services:     docker-compose down"
echo "  Stop & clean:      docker-compose down -v"
echo "  Restart API:       docker-compose restart api"
echo ""
echo "🧪 Testing:"
echo "  Test API health:   curl http://localhost:3000/health"
echo "  Test MySQL:        docker-compose exec mysql mysql -uroot -p$MYSQL_ROOT_PASSWORD -e 'SELECT 1;'"
echo "  Test Redis:        docker-compose exec redis redis-cli ping"
echo ""
