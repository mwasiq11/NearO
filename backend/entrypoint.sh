#!/bin/bash
# entrypoint.sh - Backend startup script
# Waits for MySQL and runs npm dev

set -e

HOST="$1"
if [ -z "$HOST" ]; then
  HOST="mysql"
fi

echo "=========================================="
echo "🚀 NearO Backend Startup"
echo "=========================================="
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
    if [ "$NODE_ENV" = "production" ]; then
      echo "Starting Node.js application in PRODUCTION mode..."
      exec npm start
    else
      echo "Starting Node.js application in DEVELOPMENT mode..."
      exec npm run dev
    fi
  fi
  
  if [ $((db_attempt % 5)) -eq 0 ]; then
    echo "  Still waiting for MySQL... ($db_attempt/$max_db_attempts)"
  fi
  sleep 1
done

echo "✗ MySQL did not respond within $max_db_attempts attempts"
exit 1
