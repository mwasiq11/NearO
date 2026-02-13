# AWS EC2 Deployment Guide for NearO

**Instance ID:** `i-025cc8a85dd4f60f9`  
**Public IP:** `13.222.33.156`  
**OS:** Amazon Linux 2

---

## 📋 Pre-Deployment Checklist

Before starting, ensure you have:

- [ ] AWS EC2 instance running (Amazon Linux 2)
- [ ] Security Group configured (see below)
- [ ] SSH key pair (.pem file) downloaded
- [ ] Network access to instance (port 22)

---

## 🔒 AWS Security Group Configuration

### Required Inbound Rules

| Protocol | Port | Source         | Purpose                      |
|----------|------|----------------|------------------------------|
| TCP      | 22   | Your IP / 0.0.0.0 | SSH for deployment          |
| TCP      | 3000 | 0.0.0.0/0      | API Backend                 |
| TCP      | 8080 | 0.0.0.0/0      | Frontend Application        |
| TCP      | 3306 | 0.0.0.0/0      | MySQL (optional for remote) |
| TCP      | 6379 | 0.0.0.0/0      | Redis (optional)            |

### Steps to Configure Security Group:

1. **Go to AWS Console** → EC2 Dashboard
2. **Select your instance** → Click Instance ID
3. **Find "Security Groups"** on the right panel
4. **Click the Security Group link** to open it
5. **Click "Edit inbound rules"**
6. **Add each rule above** with your IP
7. **Click "Save rules"**

---

## 🚀 Step-by-Step Deployment

### Step 1: Connect to Your EC2 Instance

Open PowerShell or Command Prompt and run:

```powershell
ssh -i "C:\path\to\your-key.pem" ec2-user@13.222.33.156
```

**Note:** Replace `C:\path\to\your-key.pem` with your actual key path.

If you get permission denied, make sure the key file has correct permissions:

```bash
chmod 400 your-key.pem  # On Linux/Mac
```

### Step 2: Clone the Repository

Once connected via SSH, run:

```bash
cd /home/ec2-user
git clone https://github.com/mwasiq11/NearO.git
cd NearO
```

### Step 3: Deploy Using the Automated Script

```bash
chmod +x deploy-to-ec2.sh
sudo ./deploy-to-ec2.sh
```

**What this script does:**
- Updates system packages
- Installs Docker and Docker Compose
- Creates production environment configuration
- Builds and starts all containers
- Verifies all services are running

**Expected output:** ✓ All services running

### Step 4: Verify Deployment

After the script completes, verify everything is working:

#### Check running containers:
```bash
docker ps
```

You should see 4 containers:
- `nearo-prod-api-1` (Express backend)
- `nearo-prod-frontend-1` (Vite frontend)
- `nearo-prod-mysql-1` (MySQL database)
- `nearo-prod-redis-1` (Redis cache)

#### Check logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

#### Test API endpoint:
```bash
curl http://localhost:3000/health
```

Should return: `{"status":"ok","timestamp":"..."}`

---

## 🌐 Access Your Application

- **Frontend:** http://13.222.33.156:8080
- **API:** http://13.222.33.156:3000
- **API Health Check:** http://13.222.33.156:3000/health

---

## 📊 Common Commands

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f mysql
docker-compose -f docker-compose.prod.yml logs -f redis
```

### Stop/Restart Services
```bash
# Stop all
docker-compose -f docker-compose.prod.yml down

# Restart all
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api
```

### View Resource Usage
```bash
docker stats
```

### SSH into a Container
```bash
docker exec -it nearo-prod-api-1 bash
docker exec -it nearo-prod-mysql-1 mysql -uroot -pWasiq00001 nearo
```

### Pull Latest Code Updates
```bash
cd /home/ec2-user/NearO
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml restart
```

---

## 🆘 Troubleshooting

### Issue: Connection Refused on Port 3000/8080

**Solution:**
1. Check if containers are running: `docker ps`
2. Check security group rules in AWS Console
3. Check logs: `docker-compose -f docker-compose.prod.yml logs`

### Issue: MySQL Connection Error

**Solution:**
```bash
docker-compose -f docker-compose.prod.yml logs mysql
docker exec -it nearo-prod-mysql-1 mysql -uroot -pWasiq00001 -e "SELECT 1"
```

### Issue: Out of Memory

**Solution:**
```bash
# Check resource usage
docker stats

# Clean up unused images/containers
docker system prune -a

# Stop and remove all containers
docker-compose -f docker-compose.prod.yml down -v
```

### Issue: Frontend Not Loading

**Solution:**
1. Check if port 8080 is open in security group
2. Check frontend logs: `docker-compose -f docker-compose.prod.yml logs frontend`
3. Ensure FRONTEND_URL in .env matches your IP

### Issue: Database Data Lost After Restart

**Solution:** Check if volume is persisted:
```bash
docker volume ls | grep mysql_data
docker inspect nearo_mysql_data
```

---

## 🔐 Security Recommendations

### For Production:

1. **Change default passwords:**
   - Edit `backend/.env` and `docker-compose.prod.yml`
   - Update database passwords
   - Regenerate JWT secrets

2. **Use HTTPS:**
   - Set up SSL certificate (Let's Encrypt)
   - Configure reverse proxy (Nginx)
   - Redirect HTTP to HTTPS

3. **Restrict Security Group:**
   - Only allow API/Frontend from your domain
   - Restrict database ports to application only
   - Use AWS WAF for additional protection

4. **Enable backups:**
   - Set up automated MySQL backups
   - Use AWS RDS for managed database
   - Enable EBS snapshots

5. **Monitor logs:**
   - Send logs to CloudWatch
   - Set up alerts for errors
   - Implement APM monitoring

---

## 📈 Performance Optimization

### For Production Load:

1. **Use AWS RDS** for MySQL instead of Docker container
2. **Use AWS ElastiCache** for Redis instead of Docker container
3. **Use Load Balancer** for distributing traffic
4. **Use Auto Scaling** for handling traffic spikes
5. **Set up CDN** (CloudFront) for static assets

### Current Resource Usage:
- **CPU:** ~2-4% idle
- **Memory:** ~400-500MB
- **Disk:** ~5GB (with volumes)

---

## 🆙 Updating the Application

### To deploy new changes:

```bash
cd /home/ec2-user/NearO
git pull
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml restart
```

### To deploy to production without downtime:

Use Docker Compose with update strategy:

```bash
docker-compose -f docker-compose.prod.yml up -d --no-deps --build api
```

---

## 📞 Support & Troubleshooting

### Quick Start Test:

```bash
# SSH to instance
ssh -i "your-key.pem" ec2-user@13.222.33.156

# Check services
docker ps

# Check logs
docker-compose -f docker-compose.prod.yml logs

# Test API
curl http://localhost:3000/health

# Test Frontend
curl http://localhost:8080 | head -20
```

### Important Files Location:

- **Config:** `/home/ec2-user/NearO/backend/.env`
- **Docker Compose:** `/home/ec2-user/NearO/docker-compose.prod.yml`
- **Logs:** Use `docker logs` command
- **Data:** `/var/lib/docker/volumes/nearo_mysql_data/`

---

## ✅ Success Checklist

After deployment, verify:

- [ ] SSH connection working
- [ ] All 4 containers running (`docker ps`)
- [ ] API responding (`curl http://localhost:3000/health`)
- [ ] Frontend accessible (http://13.222.33.156:8080)
- [ ] Database connected (check backend logs)
- [ ] Redis connected (check backend logs)
- [ ] No errors in logs (`docker-compose logs`)

---

**Deployment Complete! 🎉**

Your NearO application is now live on AWS EC2!
