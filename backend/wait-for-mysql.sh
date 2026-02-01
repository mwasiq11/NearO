#!/bin/bash
# wait-for-mysql.sh
# Usage: ./wait-for-mysql.sh <host> <cmd>

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for MySQL at $host:3306..."
DB_USER="${DB_USER:-root}"
DB_PASSWORD="${DB_PASSWORD:-}"

max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  attempt=$((attempt + 1))
  
  # Use bash TCP to check connection
  if timeout 2 bash -c "echo > /dev/tcp/$host/3306" 2>/dev/null; then
    echo "✓ Port 3306 is open on $host"
    
    # Try actual MySQL connection
    if mysql -h "$host" -P 3306 -u "$DB_USER" -p"$DB_PASSWORD" --skip-ssl -e "SELECT 1" 2>/dev/null; then
      echo "✓ MySQL is responding - connection successful!"
      echo "Executing: $cmd"
      exec $cmd
    else
      echo "Port open but MySQL not responding yet ($attempt/60)..."
    fi
  else
    if [ $((attempt % 5)) -eq 0 ]; then
      echo "Waiting for MySQL port on $host... ($attempt/60)"
    fi
  fi
  
  sleep 1
done

echo "✗ MySQL failed to connect after $max_attempts attempts"
echo "Debugging info:"
echo "  Host: $host"
echo "  Port: 3306"
echo "  User: $DB_USER"
echo "  Password: [hidden]"
exit 1
