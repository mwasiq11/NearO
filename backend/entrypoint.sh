#!/bin/bash
# entrypoint.sh - Simple, robust backend startup script

set -e

# Default values
HOST="${DB_HOST:-localhost}"
PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"
NODE_ENV="${NODE_ENV:-development}"

echo "=========================================="
echo "🚀 NearO Backend Starting"
echo "=========================================="
echo "Environment: $NODE_ENV"
echo "Database Host: $HOST:$PORT"

# ----- STEP 1: Wait for MySQL -----
echo "⏳ Waiting for MySQL at $HOST:$PORT..."

MYSQL_WAIT=0
MYSQL_MAX_ATTEMPTS=60

while [ $MYSQL_WAIT -lt $MYSQL_MAX_ATTEMPTS ]; do
  if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$HOST/$PORT" 2>/dev/null; then
    echo "✓ MySQL port is open"
    break
  fi
  MYSQL_WAIT=$((MYSQL_WAIT + 1))
  if [ $((MYSQL_WAIT % 10)) -eq 0 ]; then
    echo "  Still waiting... ($MYSQL_WAIT/$MYSQL_MAX_ATTEMPTS)"
  fi
  sleep 1
done

if [ $MYSQL_WAIT -ge $MYSQL_MAX_ATTEMPTS ]; then
  echo "✗ MySQL connection timeout!"
  exit 1
fi

# ----- STEP 2: Wait for MySQL to be ready -----
echo "⏳ Checking MySQL responsiveness..."

MYSQL_READY=0
MYSQL_READY_MAX=30

while [ $MYSQL_READY -lt $MYSQL_READY_MAX ]; do
  if mysql -h "$HOST" -P "$PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null; then
    echo "✓ MySQL is ready!"
    break
  fi
  MYSQL_READY=$((MYSQL_READY + 1))
  if [ $((MYSQL_READY % 5)) -eq 0 ]; then
    echo "  Checking MySQL... ($MYSQL_READY/$MYSQL_READY_MAX)"
  fi
  sleep 1
done

if [ $MYSQL_READY -ge $MYSQL_READY_MAX ]; then
  echo "⚠️ MySQL connection check failed, proceeding anyway..."
fi

# ----- STEP 3: Check Redis (optional) -----
if [ -n "$REDIS_HOST" ]; then
  echo "⏳ Checking Redis at $REDIS_HOST:${REDIS_PORT:-6379}..."
  if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$REDIS_HOST/${REDIS_PORT:-6379}" 2>/dev/null; then
    echo "✓ Redis is available"
  else
    echo "⚠️ Redis not available (will retry internally)"
  fi
fi

# ----- STEP 4: Start Application -----
echo ""
echo "=========================================="
echo "✓ Starting Node.js Application"
echo "=========================================="
echo ""

if [ "$NODE_ENV" = "production" ]; then
  npm start
else
  npm run dev
fi
