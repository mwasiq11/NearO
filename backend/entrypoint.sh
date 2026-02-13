#!/bin/bash
# entrypoint.sh - Backend startup script
# Waits for MySQL/Redis and runs the application
# Works in both local development and Railway production

set -e

HOST="${DB_HOST:-mysql}"

# Environment detection
NODE_ENV="${NODE_ENV:-development}"
is_production="[ \"$NODE_ENV\" = \"production\" ]"

echo "=========================================="
echo "🚀 NearO Backend Startup"
echo "=========================================="
echo "Environment: $NODE_ENV"
echo "Waiting for MySQL at $HOST:3306..."

# Wait for MySQL port to be open
max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))
  
  # Check if port is open using bash TCP
  if timeout 1 bash -c "echo > /dev/tcp/$HOST/3306" 2>/dev/null; then
    echo "✓ MySQL port is open"
    break
  fi
  
  if [ $((attempt % 10)) -eq 0 ]; then
    echo "  Attempt $attempt/$max_attempts..."
  fi
  sleep 1
done

if [ $attempt -ge $max_attempts ]; then
  echo "✗ MySQL port never opened!"
  exit 1
fi

# Wait for MySQL to actually respond
echo "Checking MySQL responsiveness..."
max_db_attempts=30
db_attempt=0
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

while [ $db_attempt -lt $max_db_attempts ]; do
  db_attempt=$((db_attempt + 1))
  
  if mysql -h "$HOST" -P 3306 -u "$DB_USER" -p"$DB_PASSWORD" --skip-ssl -e "SELECT 1" 2>/dev/null; then
    echo "✓ MySQL is responding!"
    echo ""
    
    # Check Redis connectivity (optional, don't fail if unavailable)
    if [ -n "$REDIS_HOST" ]; then
      echo "Checking Redis connectivity..."
      if timeout 2 bash -c "echo > /dev/tcp/$REDIS_HOST/${REDIS_PORT:-6379}" 2>/dev/null; then
        echo "✓ Redis is available"
      else
        echo "⚠️ Redis not available yet (will retry internally)"
      fi
    fi
    
    echo ""
    echo "=========================================="
    echo "Starting Node.js application..."
    echo "Starting in: $NODE_ENV mode"
    echo "=========================================="
    
    # Run migrations if needed
    if [ "$NODE_ENV" = "production" ]; then
      echo "Running database migrations..."
      npm run migrate 2>/dev/null || echo "No migrations to run"
    fi
    
    # Start the application based on environment
    if [ "$NODE_ENV" = "production" ]; then
      exec npm start
    else
      exec npm run dev
    fi
  fi
  
  if [ $((db_attempt % 5)) -eq 0 ]; then
    echo "  Still waiting for MySQL... ($db_attempt/$max_db_attempts)"
  fi
  sleep 1
done

echo "✗ MySQL failed to respond!"
exit 1
