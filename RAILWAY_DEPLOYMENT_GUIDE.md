# Railway Deployment Guide for NearO

## Overview

Railway is a modern platform for deploying web applications. This guide will help you deploy the NearO application with MySQL and Redis databases.

## ✅ YES - You Can Deploy with MySQL and Redis!

**Good news!** Your application can be deployed to Railway with MySQL and Redis. Railway supports:

1. **Managed MySQL** - Railway's built-in MySQL service (recommended)
2. **Managed Redis** - Railway's built-in Redis service (recommended)
3. **Docker containers** - You can also containerize MySQL and Redis if needed

The recommended approach is using **Railway's managed services** because:
- ✅ Automatic backups
- ✅ Automatic scaling
- ✅ High availability
- ✅ No infrastructure management needed
- ✅ Better performance optimization

## Prerequisites

- Railway account (https://railway.app)
- Railway CLI installed (`npm install -g @railway/cli`)
- Git repository with your code

## Step 1: Connect Your GitHub Repository

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Authorize Railway and select the `mwasiq11/NearO` repository
5. Choose the `main` branch

## Step 2: Create Services

### Option A: Using Railway's Managed Services (RECOMMENDED)

#### 2.1 Add MySQL Service

1. In your Railway project, click "+ Add Service"
2. Select "MySQL"
3. Configure:
   - Version: 8.0
   - Leave other settings as default
4. Railway will automatically create environment variables:
   - `DATABASE_URL` - Full connection string
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLHOST`
   - `MYSQLPORT` (usually 3306)
   - `MYSQLDATABASE`

#### 2.2 Add Redis Service

1. Click "+ Add Service"
2. Select "Redis"
3. Configure:
   - Version: Latest stable
4. Railway will automatically create:
   - `REDIS_URL` - Full connection string
   - `REDIS_HOST`
   - `REDIS_PASSWORD`

#### 2.3 Deploy Backend Service

1. In your Railway project, click "+ Add Service"
2. Select "GitHub Repo"
3. Select your `mwasiq11/NearO` repository
4. Configure:
   - **Root Directory**: `backend`
   - **Dockerfile**: `Dockerfile.railway`
   - **Port**: 3000

### Option B: Using Docker Compose (Alternative)

Use the existing `docker-compose.yml` by adding a `railway.yaml` file:

```yaml
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile.railway
    environment:
      - DB_HOST=$MYSQL_HOST
      - DB_PORT=3306
      - DB_USER=$MYSQL_USER
      - DB_PASSWORD=$MYSQL_PASSWORD
      - DB_NAME=$MYSQL_DATABASE
      - REDIS_URL=$REDIS_URL

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.railway
```

## Step 3: Configure Environment Variables

### Backend Environment Variables

Set these in Railway dashboard (Variables section):

```env
# Node Environment
NODE_ENV=production
PORT=3000

# Database (Railway provides these automatically if using managed MySQL)
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USER=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_NAME=${{ MySQL.MYSQLDATABASE }}

# Redis (Railway provides these automatically if using managed Redis)
REDIS_HOST=${{ Redis.REDIS_HOST }}
REDIS_PORT=${{ Redis.REDIS_PORT }}
REDIS_PASSWORD=${{ Redis.REDIS_PASSWORD }}
REDIS_URL=${{ Redis.REDIS_URL }}

# Frontend URL
FRONTEND_URL=https://yourdomain.railway.app

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-key-change-this

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# API Configuration
API_VERSION=v2
```

### Frontend Environment Variables

```env
VITE_API_URL=https://your-backend-service.railway.app/api
```

## Step 4: Set Up Domain (Optional)

1. Go to your Railway project settings
2. Add custom domain
3. Update `FRONTEND_URL` in backend variables

## Step 5: Deploy

### Automatic Deployment (Recommended)

Railway automatically deploys when you push to the main branch:

```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

## Step 6: Verify Deployment

1. Check Railway dashboard for deployment status
2. Visit your deployed app URL
3. Check logs in Railway dashboard

### Quick Health Check

```bash
curl https://your-backend.railway.app/health
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if MySQL connection is working
# Railway logs will show: "✅ Database initialized successfully"

# If connection fails:
1. Verify DATABASE_URL is set correctly
2. Check MySQL service is running (green status in Railway)
3. Review logs in Railway dashboard
```

### Redis Connection Issues

```bash
# Check if Redis is connected
# Logs should show successful cache initialization

# If Redis fails:
1. Verify REDIS_URL is set
2. Check Redis service status
3. Ensure REDIS_PASSWORD is correct
```

### Migrations Not Running

If database tables aren't being created:

1. SSH into your Railway service
2. Run migrations manually:
   ```bash
   npm run migrate
   ```

Or update `entrypoint.sh` to automatically run migrations:

```bash
#!/bin/bash
# Run migrations before starting app
npm run migrate

# Then start the server
npm start
```

## Database Initialization

The app automatically initializes the database on first run. If you need to manually set up:

```bash
# SSH into backend service
railway shell

# Run migration script
npm run migrate
```

## Monitoring

1. **Logs**: View real-time logs in Railway dashboard
2. **Metrics**: Check CPU, Memory, Network usage
3. **Health**: `/health` endpoint shows app status

## Scaling

### Horizontal Scaling (Multiple Instances)

Railway allows running multiple replicas:

1. Go to service settings
2. Increase "Compute"
3. Set "Replicas" to desired number

### Database Scaling

For MySQL:
1. Increase storage/compute in Railway MySQL settings
2. No downtime scaling available

For Redis:
1. Increase memory allocation
2. Enable persistence if needed

## Cost Considerations

Railway pricing:
- **Compute**: $10 for first 500 hours/month (includes ~2 services)
- **MySQL**: $5/month for managed MySQL
- **Redis**: $5/month for managed Redis

### Estimate for full deployment:
- Backend: $10
- Frontend: Included in compute
- MySQL: $5
- Redis: $5
- **Total**: ~$20-25/month

## CI/CD Pipeline

Railway automatically deploys on push to main. To customize:

1. Create `railway.json` at project root
2. Define build and deploy strategies
3. Push changes

## Advanced: Using Docker Compose with Railway

If you want to use the same setup as local development:

```bash
# Create railway-docker-compose.yml
# Then in Railway, select "Docker Compose" as deployment method
```

## Rollback/Recovery

### Automatic Rollback

If a deployment fails:
1. Railway keeps previous successful image
2. Automatically reverts with one click
3. No manual intervention needed

### Manual Rollback

1. Go to Deployments in Railway
2. Click "Redeploy" on previous successful version

## Next Steps

1. ✅ Add MySQL service
2. ✅ Add Redis service
3. ✅ Configure backend environment variables
4. ✅ Deploy backend service
5. ✅ Deploy frontend service
6. ✅ Test health endpoints
7. ✅ Set up custom domain
8. ✅ Monitor logs and metrics

## Support

- Railway Docs: https://docs.railway.app
- Railway Community: https://community.railway.app
- Project Issues: Check GitHub issues in mwasiq11/NearO

---

**Last Updated**: February 2026
**Status**: Ready for Production Deployment ✅
