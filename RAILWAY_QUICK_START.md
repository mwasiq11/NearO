# Railway Deployment Quick Start Guide

## TL;DR - Deploy in 5 Minutes

### 1. Commit Configuration
```bash
git add .
git commit -m "Railway deployment configured"
git push origin main
```

### 2. Fix Failed Deployment (If you had an error)

⚠️ **If you got "Dockerfile does not exist" error:**
- See [RAILWAY_DOCKERFILE_FIX.md](./RAILWAY_DOCKERFILE_FIX.md) for quick fix
- Delete the failed service in Railway
- Railway auto-redeploys from git push

✅ **Root Dockerfile is now created** - Railway will find it automatically

### 3. Connect Railway
- Go to https://railway.app/dashboard
- New Project → Deploy from GitHub
- Select `mwasiq11/NearO` repository

### 4. Add Services (one by one via Railway UI)
- Click "+ Add Service"
- Add MySQL (Railway will auto-configure)
- Add Redis (Railway will auto-configure)

### 5. Set Environment Variables
Copy into Railway dashboard Variables section:

```env
NODE_ENV=production
PORT=3000
API_VERSION=v2

# These come from Railway MySQL service
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USER=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_NAME=${{ MySQL.MYSQLDATABASE }}

# These come from Railway Redis service
REDIS_HOST=${{ Redis.REDIS_HOST }}
REDIS_PORT=${{ Redis.REDIS_PORT }}
REDIS_PASSWORD=${{ Redis.REDIS_PASSWORD }}
REDIS_URL=${{ Redis.REDIS_URL }}

# Your custom values
FRONTEND_URL=https://your-app-url.railway.app
JWT_SECRET=generate-a-strong-secret-with-openssl-rand-hex-32
```

### 5. Done! 🎉

Railway will automatically deploy from GitHub push.

---

## Environment Variables Explained

| Variable | Value | Example |
|----------|-------|---------|
| `NODE_ENV` | production or development | production |
| `PORT` | Service port | 3000 |
| `DB_HOST` | MySQL hostname | ip-xxx.ec2.amazonaws.com |
| `DB_PORT` | MySQL port | 3306 |
| `DB_USER` | MySQL user | root |
| `DB_PASSWORD` | MySQL password | mystrongpassword |
| `DB_NAME` | Database name | nearo |
| `REDIS_HOST` | Redis hostname | redis-xxx.ec2.amazonaws.com |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | redispassword |
| `REDIS_URL` | Full Redis URI | redis://user:pass@host:port |
| `FRONTEND_URL` | Your frontend URL | https://frontend-app.railway.app |
| `JWT_SECRET` | Secret for JWT signing | use openssl rand -hex 32 |

---

## What's Different from AWS EC2?

| Aspect | AWS EC2 | Railway |
|--------|---------|---------|
| Infrastructure | Manage servers | Platform manages |
| MySQL | ECS Task + RDS | Managed MySQL service |
| Redis | ElastiCache | Managed Redis service |
| Domain | ELB + Route53 | Railway domains |
| SSL/TLS | ACM | Auto-provided |
| Backups | Manual setup | Automatic |
| Scaling | Configure replicas | Set replica count |

---

## Troubleshooting

### "Can't connect to MySQL"
```bash
# Check logs
railway logs

# Verify MySQL service is running (green status)
# Check environment variables are set correctly
```

### "Database tables missing"
```bash
# SSH into Railway backend
railway shell

# Run migrations
npm run migrate
npm run seed
```

### "Redis connection timeout"
```bash
# SSH into container
railway shell

# Test Redis
redis-cli -h $REDIS_HOST -a $REDIS_PASSWORD ping

# Should return: PONG
```

---

## Files Created for Railway

✅ `backend/Dockerfile.railway` - Optimized production Docker
✅ `frontend/Dockerfile.railway` - Optimized production Docker
✅ `railway.json` - Railway configuration
✅ `Procfile` - Process file (fallback)
✅ `.railwayignore` - Files to ignore
✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Detailed guide
✅ `RAILWAY_ENVIRONMENT_TEMPLATE.env` - All env vars
✅ `DOCKER_MYSQL_REDIS_FAQ.md` - FAQ document

---

## Your App is Production-Ready! ✅

✅ MySQL connection pooling configured
✅ Redis caching enabled
✅ Database auto-initialization
✅ Health check endpoint ready
✅ Docker containers optimized
✅ Environment variables set up
✅ Graceful shutdown support

No additional code changes needed! Deploy now.

---

## Next Steps

1. Read `RAILWAY_DEPLOYMENT_GUIDE.md` for detailed instructions
2. Review `DOCKER_MYSQL_REDIS_FAQ.md` for technical details
3. Push your code to main branch
4. Follow the 5-minute deployment steps above
5. Monitor logs in Railway dashboard

---

**Status**: 🚀 **Ready to Deploy**

Your NearO application is fully configured and ready to deploy to Railway with MySQL and Redis!

For questions, visit: https://docs.railway.app
