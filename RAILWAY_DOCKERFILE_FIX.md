# 🔧 Railway Dockerfile Error - Fix Guide

## Error: "Dockerfile `Dockerfile` does not exist"

This error occurs when Railway tries to build your application but can't find the Dockerfile at the root level.

### ✅ What I've Fixed

Created:
- ✅ **`Dockerfile`** (root level) - Railway now finds this automatically
- ✅ **`railway.json`** - Updated to use correct Dockerfile
- ✅ **`railway.toml`** - TOML configuration option

### 🚀 How to Fix Your Deployment

#### Option 1: Delete Failed Deployment & Redeploy (RECOMMENDED)

1. **Go to Railway Dashboard**
   - Select your project
   - Click on the "web" service showing FAILED
   - Go to Settings
   - Click "Delete Service"

2. **Commit the Fixed Files**
   ```bash
   git add Dockerfile railway.json railway.toml
   git commit -m "Fix: Add root Dockerfile for Railway"
   git push origin main
   ```

3. **Create New Deployment**
   - Go to Railway dashboard
   - Click "+ Add Service"
   - Select "GitHub Repo"
   - Select `mwasiq11/NearO`
   - Click Deploy

#### Option 2: Redeploy Current Service

1. Go to the failed service
2. Click "Redeploy"
3. Wait for rebuild

---

## File Changes Explained

### Root `Dockerfile` (NEW)
```dockerfile
FROM node:22-alpine AS dependencies
# Install production dependencies

FROM node:22-alpine
# Copy dependencies + run backend
EXPOSE 3000
CMD ["./entrypoint.sh"]
```

What it does:
- ✅ Builds backend service
- ✅ Railway finds it automatically
- ✅ Exposes port 3000
- ✅ Runs entrypoint script

### `railway.json` (UPDATED)
```json
{
  "build": {
    "builder": "dockerfile",
    "dockerfile": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 5,
    "numReplicas": 1
  }
}
```

What it does:
- ✅ Tells Railway which Dockerfile to use
- ✅ Configures deployment settings
- ✅ Sets restart policy

### `railway.toml` (NEW)
```toml
[build]
builder = "dockerfile"
dockerfile = "Dockerfile"

[deploy]
restartPolicyType = "on_failure"
```

Alternative TOML format for configuration.

---

## Environment Variables Still Needed

Make sure these are still set in Railway dashboard under "Variables":

```env
NODE_ENV=production
PORT=3000
DB_HOST=${{ MySQL.MYSQLHOST }}
DB_PORT=${{ MySQL.MYSQLPORT }}
DB_USER=${{ MySQL.MYSQLUSER }}
DB_PASSWORD=${{ MySQL.MYSQLPASSWORD }}
DB_NAME=${{ MySQL.MYSQLDATABASE }}
REDIS_HOST=${{ Redis.REDIS_HOST }}
REDIS_PORT=${{ Redis.REDIS_PORT }}
REDIS_PASSWORD=${{ Redis.REDIS_PASSWORD }}
REDIS_URL=${{ Redis.REDIS_URL }}
FRONTEND_URL=https://your-app.railway.app
JWT_SECRET=<your-secret-key>
```

---

## Verification Checklist

After redeployment:

- [ ] Service shows "Running" status
- [ ] Status is GREEN (not red/yellow)
- [ ] Logs show "Initialization" → "Build" → "Deploy"
- [ ] Logs show "✅ Database initialized successfully"
- [ ] Health endpoint: `/health` returns 200

---

## If Still Getting Error

### Check Service Configuration
1. Go to service → Settings
2. Verify:
   - [ ] Root Directory: empty or `.`
   - [ ] Dockerfile: `Dockerfile`
   - [ ] Build Command: (empty to use default)

### Check File Paths
Confirm these exist in your repository:
- [ ] `Dockerfile` (root level) - NEW
- [ ] `backend/Dockerfile.railway`
- [ ] `frontend/Dockerfile.railway`
- [ ] `railway.json` - UPDATED

### Manual Redeploy
```bash
# From your local machine
git add .
git commit -m "Fix Railway Dockerfile configuration"
git push origin main

# Watch Railway dashboard for auto-deploy
# or manually trigger in dashboard
```

---

## Frontend Service (Separate)

If you want to deploy frontend separately:

1. In Railway → "+ Add Service"
2. GitHub Repo → mwasiq11/NearO
3. Configure:
   - Root Directory: `frontend`
   - Dockerfile: `Dockerfile.railway`
   - Port: 8080

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Still says Dockerfile not found | Delete service, commit again, redeploy |
| Build takes too long | Check logs, may be installing deps |
| Deployment stuck on "Building" | Wait 5-10 minutes, then restart |
| Port 3000 not exposed | Check PORT=3000 in environment vars |
| Can't connect to MySQL | Verify MySQL service is GREEN |
| Can't connect to Redis | Verify Redis service is GREEN |

---

## Next Steps

1. **Commit changes**
   ```bash
   git add .
   git commit -m "Fix: Root Dockerfile for Railway deployment"
   git push origin main
   ```

2. **Delete failed service** (in Railway dashboard)

3. **Redeploy** (manually or auto from git push)

4. **Verify** logs show successful build

---

**Status**: ✅ Fixed - Ready to redeploy

**Next Action**: Push changes and redeploy in Railway dashboard

---

See also:
- [RAILWAY_QUICK_START.md](./RAILWAY_QUICK_START.md)
- [RAILWAY_DEPLOYMENT_GUIDE.md](./RAILWAY_DEPLOYMENT_GUIDE.md)
