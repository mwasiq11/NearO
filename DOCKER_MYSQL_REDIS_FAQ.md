# Docker + MySQL + Redis Deployment FAQ

## Question: Can we deploy the app with MySQL and Redis in Docker containers on Railway?

## Answer: YES! ✅

Your application uses MySQL and Redis, and **both CAN be deployed with Docker on Railway**. Here's what you need to know:

---

## Deployment Options

### Option 1: Railway Managed Services (RECOMMENDED) ⭐⭐⭐

**What**: Use Railway's built-in MySQL and Redis services

**Pros**:
- ✅ Zero maintenance
- ✅ Automatic backups
- ✅ Automatic updates
- ✅ High availability
- ✅ Best performance
- ✅ Better security (managed by Railway)
- ✅ Easiest setup

**Cons**:
- Limited customization of database parameters

**Setup Time**: 5 minutes

**Cost**: ~$5/month per service

---

### Option 2: Docker Containers in Railway 🐳

**What**: Run MySQL and Redis as Docker containers within Railway

**Pros**:
- ✅ Full control over configuration
- ✅ Custom database parameters
- ✅ Can use exact versions you need
- ✅ Similar to local development

**Cons**:
- ❌ You manage backups
- ❌ No automatic scaling
- ❌ More resources needed
- ❌ Manual updates
- ⚠️ Data persistence challenges on Railway

**Setup Time**: 15 minutes

**Cost**: $10-20/month (more compute needed)

---

## Recommended: Railway Managed Services

### Why This Approach?

1. **Application Code Only**: Deploy your Node.js code to Railway
2. **Managed Dependencies**: MySQL and Redis hosted separately
3. **Better Scaling**: Services scale independently
4. **Data Safety**: Railway handles backups

### Architecture

```
┌─────────────────────────────────┐
│      Your Code (Docker)         │
│   (Node.js App - Railway Compute)│
│                                 │
│  Ports:                         │
│  - 3000 (Express API)           │
│  - 8080 (Frontend)              │
└────┬────────────────┬───────────┘
     │                │
     │ (TCP/TLS)      │ (TCP/TLS)
     ▼                ▼
┌──────────────┐  ┌──────────────┐
│   MySQL      │  │    Redis     │
│  (Managed)   │  │  (Managed)   │
│              │  │              │
│- 3306        │  │- 6379        │
│- Auto backup │  │- Persistence │
│- HA enabled  │  │- HA enabled  │
└──────────────┘  └──────────────┘
```

---

## Current Application Status ✅

Your app is already ready for MySQL + Redis deployment:

### ✅ Database Configuration
```javascript
// src/db/database.js
const dbConfig = {
  host: process.env.DB_HOST,              // Railway provides
  port: process.env.DB_PORT,              // Railway provides
  user: process.env.DB_USER,              // Railway provides
  password: process.env.DB_PASSWORD,      // Railway provides
  database: process.env.DB_NAME,          // Railway provides
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};
```

### ✅ Redis Configuration
```javascript
// src/queue/redisClient.js
const client = redis.createClient({
  host: process.env.REDIS_HOST,           // Railway provides
  port: process.env.REDIS_PORT,           // Railway provides
  password: process.env.REDIS_PASSWORD    // Railway provides
});
```

### ✅ Environment Variables
Your app already reads all necessary vars - no code changes needed! 🎉

---

## Step-by-Step Deployment

### Step 1: Set Up Railway Project

```bash
# Login to Railway CLI
railway login

# Create new project (or use existing)
railway init
```

### Step 2: Add MySQL Service

```bash
# Add MySQL to your project
railway add mysql

# This creates:
# - MYSQL_USER
# - MYSQL_PASSWORD
# - MYSQL_HOST
# - MYSQL_PORT
# - MYSQL_DATABASE
```

### Step 3: Add Redis Service

```bash
# Add Redis to your project
railway add redis

# This creates:
# - REDIS_HOST
# - REDIS_PORT
# - REDIS_PASSWORD
# - REDIS_URL
```

### Step 4: Deploy Application

```bash
# Railway automatically deploys from GitHub
# Just push your code
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

### Step 5: Configure Environment

In Railway dashboard:

```env
# Database
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USER=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_NAME=${{ MySQL.MYSQLDATABASE }}

# Redis
REDIS_HOST=${{ Redis.REDIS_HOST }}
REDIS_PORT=${{ Redis.REDIS_PORT }}
REDIS_PASSWORD=${{ Redis.REDIS_PASSWORD }}
REDIS_URL=${{ Redis.REDIS_URL }}

# App
NODE_ENV=production
PORT=3000
JWT_SECRET=generate-a-strong-secret
FRONTEND_URL=https://your-domain.railway.app
```

---

## Important Configuration Notes

### Connection Pooling

Your app uses `mysql2/promise` with connection pooling:

```javascript
connectionLimit: 10,    // Good for production
queueLimit: 0          // Unlimited queue
```

✅ This is already optimized for Railway!

### Health Check

Railway needs to verify your app is healthy:

```javascript
// /health endpoint returns
{
  status: 'ok',
  database: 'MySQL',
  features: { caching: true }
}
```

✅ Already implemented!

### Graceful Shutdown

When Railway stops a container:
1. It sends SIGTERM signal
2. Your app should close connections
3. Max 30 seconds to shutdown

**You should add**:

```javascript
// src/app.js
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing connections...');
  
  // Close database pool
  await pool.end();
  
  // Close Redis
  await redis.quit();
  
  // Close server
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

---

## Data Persistence

### MySQL
- ✅ Automatic persistence (file-based)
- ✅ Railway handles backups
- ✅ Data survives container restarts

### Redis
- ⚠️ In-memory (data lost on restart if not configured)
- ✅ Use `redis-server --appendonly yes` for persistence
- ✅ Your docker-compose already has this!

---

## Troubleshooting

### Problem: Can't Connect to MySQL

```bash
# Check Railway logs
railway logs

# Verify environment variables
railway status

# Test connection manually
# SSH into Railway container
railway shell
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD
```

### Problem: Can't Connect to Redis

```bash
# Check Redis service status
redis-cli -h $(echo $REDIS_HOST) ping

# If Redis isn't started
railway up redis
```

### Problem: Database Tables Not Created

```bash
# Run migrations manually
railway shell
npm run migrate

# Or check auto-init in database.js
```

---

## Performance Tips

### Connection Pooling
✅ Already configured optimally (connectionLimit: 10)

### Redis Caching
✅ Your app uses Redis for:
- Session storage
- Message caching
- Notification queue

### Database Optimization
- ✅ Read-write separation configured
- ✅ Indexes already created
- ✅ Query optimization in place

---

## Monitoring & Logs

### View Logs
```bash
# Real-time logs
railway logs

# Follow logs
railway logs --follow
```

### Metrics
- CPU Usage
- Memory Usage
- Network I/O
- Request rates

All available in Railway dashboard!

---

## Cost Breakdown (Monthly)

| Service | Cost | Notes |
|---------|------|-------|
| Backend | $10 | Share compute with frontend |
| Frontend | Included | Static site serving |
| MySQL | $5 | Managed, 1GB storage |
| Redis | $5 | Managed |
| Domain | $0-12 | Optional custom domain |
| **Total** | **~$20** | Very reasonable! |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Migrations not running | Add to entrypoint.sh before npm start |
| Redis timeout | Increase REDIS_TIMEOUT variable |
| MySQL connection pool exhausted | Check for connection leaks |
| Slow queries | Enable query logging, optimize indexes |
| Out of memory | Increase Railway compute tier |

---

## Migration from AWS EC2

If moving from AWS EC2:

```bash
# Backup your MySQL data
mysqldump -h old-host -u user -p database > backup.sql

# Import to Railway MySQL
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD < backup.sql

# Copy Redis data
# Use Redis dump-restore or resync
```

---

## Final Checklist

- [ ] Repository is public or Railway has access
- [ ] Dockerfile.railway created for backend
- [ ] Dockerfile.railway created for frontend
- [ ] Environment variables documented
- [ ] MySQL service added to Railway
- [ ] Redis service added to Railway
- [ ] Environment variables configured in Railway
- [ ] Health check endpoint verified
- [ ] Code pushed to GitHub
- [ ] Deployment complete and working
- [ ] Logs show no errors
- [ ] Can access /health endpoint
- [ ] Database tables created

---

## Next Steps

1. Read [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
2. Deploy using the step-by-step instructions
3. Monitor logs in Railway dashboard
4. Set up custom domain (optional)
5. Configure monitoring alerts (optional)

You're all set! 🚀

---

**Status**: ✅ **Ready to Deploy with MySQL and Redis**

Your application architecture is perfectly suited for Railway with managed MySQL and Redis services!
