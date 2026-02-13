# EC2 Deployment Quick Reference

## 🎯 Your Instance Details
```
Instance ID: i-025cc8a85dd4f60f9
Public IP:  13.222.33.156
OS:         Amazon Linux 2
Region:     ap-northeast-1 (Tokyo)
```

## 📝 Connection Command
```bash
ssh -i "your-key.pem" ec2-user@13.222.33.156
```

## 🚀 Deployment Command (inside EC2)
```bash
cd /home/ec2-user && \
git clone https://github.com/mwasiq11/NearO.git && \
cd NearO && \
chmod +x deploy-to-ec2.sh && \
sudo ./deploy-to-ec2.sh
```

## ✅ Verification Commands
```bash
# Check all services
docker ps

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs api
docker-compose -f docker-compose.prod.yml logs mysql
docker-compose -f docker-compose.prod.yml logs redis

# Test API
curl http://localhost:3000/health

# Test Frontend
curl http://localhost:8080
```

## 🌐 Access URLs
| Service    | URL                          |
|-----------|------------------------------|
| Frontend  | http://13.222.33.156:8080   |
| API       | http://13.222.33.156:3000   |
| Health    | http://13.222.33.156:3000/health |

## 🛑 Useful Commands
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Restart specific service
docker-compose -f docker-compose.prod.yml restart api

# SSH into container
docker exec -it nearo-prod-api-1 bash

# View resource usage
docker stats

# Update and redeploy
cd /home/ec2-user/NearO && \
git pull && \
docker-compose -f docker-compose.prod.yml build && \
docker-compose -f docker-compose.prod.yml restart
```

## 🔒 Security Group Rules (AWS Console)

| Protocol | Port | Source        | Description |
|----------|------|---------------|-------------|
| TCP      | 22   | Your IP       | SSH         |
| TCP      | 3000 | 0.0.0.0/0     | API         |
| TCP      | 8080 | 0.0.0.0/0     | Frontend    |

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check security group rules |
| Container not starting | `docker-compose logs api` |
| Out of memory | `docker system prune -a` |
| MySQL error | `docker-compose logs mysql` |

## 📦 Services Running
- **API:** Node.js Express (port 3000)
- **Frontend:** Vite React (port 8080)
- **Database:** MySQL 8.0 (port 3306)
- **Cache:** Redis 7.0 (port 6379)

## 🔄 Full Deployment Cycle
1. SSH to instance
2. Clone repository
3. Run deploy script
4. Wait 5-10 minutes
5. Verify with `docker ps`
6. Test URLs
