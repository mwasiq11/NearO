#!/bin/bash

#################################################################################
# NearO AWS EC2 Deployment Script
# For Amazon Linux 2
# Usage: ./deploy-to-ec2.sh
#################################################################################

set -e

echo "======================================================================"
echo "🚀 NearO Deployment to AWS EC2 (Amazon Linux 2)"
echo "======================================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Update system
echo -e "${YELLOW}[STEP 1]${NC} Updating system packages..."
sudo yum update -y
sudo yum install -y git curl wget

# Step 2: Install Docker
echo -e "${YELLOW}[STEP 2]${NC} Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
echo -e "${GREEN}✓ Docker installed${NC}"

# Step 3: Install Docker Compose
echo -e "${YELLOW}[STEP 3]${NC} Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
docker-compose --version
echo -e "${GREEN}✓ Docker Compose installed${NC}"

# Step 4: Clone repository
echo -e "${YELLOW}[STEP 4]${NC} Cloning NearO repository..."
cd /home/ec2-user
if [ ! -d "NearO" ]; then
    git clone https://github.com/mwasiq11/NearO.git
else
    echo "Repository already exists. Pulling latest changes..."
    cd NearO
    git pull
    cd ..
fi
cd NearO
echo -e "${GREEN}✓ Repository cloned${NC}"

# Step 5: Create .env for backend
echo -e "${YELLOW}[STEP 5]${NC} Creating production environment configuration..."
cat > backend/.env << 'EOF'
# MySQL Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=nearo
DB_USER=root
DB_PASSWORD=Wasiq00001

# JWT Authentication
JWT_SECRET=e37a8fac0903a3671dd5cdf7f1e70b954da5d6be27612dc492afaece5695423ab
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=aeb5547c3761041ce32698fed2742002ee46340f79f27a2e1caae0aeee4252f
JWT_REFRESH_EXPIRE=30d

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=muhammadwasiq67585@gmail.com
SMTP_PASS=qatp ckwi lztk kamt
FROM_EMAIL=muhammadwasiq67585@gmail.com
FROM_NAME=NearO App

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX=10
SEARCH_RATE_LIMIT_MAX=200

# Application - PRODUCTION
PORT=3000
NODE_ENV=production
FRONTEND_URL=http://13.222.33.156:8080
API_VERSION=v2

# Redis Configuration
REDIS_URL=redis://redis:6379
EOF

echo -e "${GREEN}✓ Environment configured${NC}"

# Step 6: Create docker-compose override for production
echo -e "${YELLOW}[STEP 6]${NC} Setting up production Docker Compose..."

cat > docker-compose.prod.yml << 'EOF'
version: "3.9"
name: "NearO-Prod"

services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    restart: always
    env_file: ./backend/.env
    environment:
      DB_HOST: mysql
      DB_PORT: 3306
      DB_USER: root
      DB_PASSWORD: Wasiq00001
      DB_NAME: nearo
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    ports:
      - "3000:3000"
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - nearo-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health", "||", "exit", "1"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    restart: always
    ports:
      - "8080:8080"
    command: ["npm", "run", "dev", "--", "--host"]
    networks:
      - nearo-net
    depends_on:
      - api

  mysql:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: Wasiq00001
      MYSQL_DATABASE: nearo
      MYSQL_ROOT_HOST: '%'
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - nearo-net
    command:
      - --default-authentication-plugin=mysql_native_password
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --max_connections=500
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "127.0.0.1", "-uroot", "-pWasiq00001"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7.0-alpine
    restart: always
    ports:
      - "6379:6379"
    networks:
      - nearo-net
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql_data:

networks:
  nearo-net:
EOF

echo -e "${GREEN}✓ Production Docker Compose configured${NC}"

# Step 7: Start services
echo -e "${YELLOW}[STEP 7]${NC} Starting Docker containers..."
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

echo -e "${GREEN}✓ Containers started${NC}"

# Step 8: Wait for services to be healthy
echo -e "${YELLOW}[STEP 8]${NC} Waiting for services to be ready..."
sleep 30

# Step 9: Verify services
echo -e "${YELLOW}[STEP 9]${NC} Verifying services..."
echo ""

if docker ps | grep -q nearo-prod-mysql; then
    echo -e "${GREEN}✓ MySQL is running${NC}"
else
    echo -e "${RED}✗ MySQL failed to start${NC}"
fi

if docker ps | grep -q nearo-prod-redis; then
    echo -e "${GREEN}✓ Redis is running${NC}"
else
    echo -e "${RED}✗ Redis failed to start${NC}"
fi

if docker ps | grep -q nearo-prod-api; then
    echo -e "${GREEN}✓ API is running${NC}"
else
    echo -e "${RED}✗ API failed to start${NC}"
fi

if docker ps | grep -q nearo-prod-frontend; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
fi

echo ""
echo "======================================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo "======================================================================"
echo ""
echo "📍 Application URLs:"
echo "   Frontend:  http://13.222.33.156:8080"
echo "   API:       http://13.222.33.156:3000"
echo ""
echo "📋 Useful Commands:"
echo "   View logs:       docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services:   docker-compose -f docker-compose.prod.yml down"
echo "   Restart:         docker-compose -f docker-compose.prod.yml restart"
echo ""
echo "======================================================================"
