# 🚀 Quick Reference - NearO Role-Based System

## 🌐 Access URLs

| Component | URL | Status |
|-----------|-----|--------|
| Frontend | http://localhost:8080 | ✅ Running |
| Backend API | http://localhost:3000 | ✅ Running |
| Health Check | http://localhost:3000/health | ✅ Running |

---

## 🔐 Login Portals

### 1️⃣ **Provider/Seeker Portal**
- **URL**: http://localhost:8080/login
- **Features**: Sign up + Login tabs
- **Default Test Account**: 
  - Email: (create new or use existing)
  - Password: (you set it)
- **Next Page**: `/dashboard` (unified dashboard)

### 2️⃣ **Moderator Portal**
- **URL**: http://localhost:8080/moderator-login
- **Features**: Login only (no signup)
- **Access**: Only accounts with role='moderator'
- **Note**: Can't use user account here
- **Next Page**: `/moderator-dashboard`

### 3️⃣ **Admin Portal**
- **URL**: http://localhost:8080/admin-login
- **Features**: Login only (no signup)
- **Default Account**:
  - Email: `admin@example.com`
  - Password: `Admin123`
- **Next Page**: `/admin-dashboard`

---

## 👤 User Roles & What They Can Do

### **User (Provider/Seeker)**
```
✅ Sign up (with email verification)
✅ Login
✅ Create services (as provider)
✅ Browse services (as seeker)
✅ Book services
✅ View own history
✅ View dashboard stats
❌ Cannot access moderator portal
❌ Cannot access admin portal
```

### **Moderator**
```
✅ Login only
✅ View all services
✅ Approve/Reject services
✅ View user reports
✅ View moderation history
❌ Cannot access admin functions
❌ Cannot see admin action logs
❌ Cannot manage users
```

### **Admin**
```
✅ Login only
✅ Full system access
✅ Create/manage moderators
✅ View complete history
✅ Manage users
✅ System configuration
✅ View all admin actions
```

---

## 📍 Frontend Routes (After Login)

### User Dashboard
- **Path**: `/dashboard`
- **Shows**: 
  - Stats card (services, bookings, reviews, rating)
  - My Services tab (list with bookings count)
  - Bookings tab (list of booked services)
  - Quick Actions (Post Service, Browse, Profile, Messages)

### History Page
- **Path**: `/history`
- **Shows**: 
  - Timeline of activities
  - Action type, timestamp, actor name/email
  - Role-based filtering (automatic)
  - Pagination

### Moderator Dashboard
- **Path**: `/moderator-dashboard`
- **Shows**:
  - Moderation queue
  - Pending services count
  - Pending reports
  - Service approval interface

### Admin Dashboard
- **Path**: `/admin-dashboard`
- **Shows**: (Structure ready, features TBD)

---

## 🔌 API Endpoints Quick Reference

### Authentication
```
POST /auth/register          → Create user account
POST /auth/login             → User login
POST /auth/moderator-login   → Moderator login
POST /auth/admin-login       → Admin login
POST /auth/refresh           → Refresh JWT token
POST /auth/logout            → Logout
GET  /auth/verify-email      → Verify email token
```

### History & Audit
```
GET /history                 → View activity (role-based)
GET /history/service         → View service history
GET /history/dashboard-stats → Get dashboard stats
```

### Example Calls
```bash
# User login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"TestPass123"}'

# View history with token
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer <TOKEN>"

# Get dashboard stats
curl -X GET http://localhost:3000/history/dashboard-stats \
  -H "Authorization: Bearer <TOKEN>"
```

---

## 📊 Database History Tracking

### What Gets Logged
Every action stored with:
- ✅ **Actor**: Name, email, user ID
- ✅ **Action**: Type (login, create, approve, etc.)
- ✅ **Entity**: What was affected (service, user, etc.)
- ✅ **Timestamp**: When it happened (ISO 8601)
- ✅ **Metadata**: Additional context
- ✅ **IP Address**: For security
- ✅ **User Agent**: Browser info

### Access Rules
| Role | Can See |
|------|---------|
| User | Only their own history |
| Moderator | Moderation activities + user actions (NOT admin) |
| Admin | Everything |

---

## 🧪 Test Scenarios

### Scenario 1: User Sign Up & Login
```
1. Go to http://localhost:8080/login
2. Click "Sign Up" tab
3. Fill form (name, email, password)
4. Check email for verification link (will be in console in dev)
5. Verify email
6. Click "Sign In" tab
7. Login with credentials
8. Land on /dashboard
```

### Scenario 2: Moderator Access
```
1. Go to http://localhost:8080/moderator-login
2. Try to login with your user account
3. Should fail: "Invalid email or password"
4. (Only accounts with role='moderator' work)
```

### Scenario 3: Admin Access
```
1. Go to http://localhost:8080/admin-login
2. Login with:
   - Email: admin@example.com
   - Password: Admin123
3. Should redirect to /admin-dashboard
4. Go to /history to see all platform activity
```

### Scenario 4: View History
```
1. Login as user at /login
2. Click "View History" in dashboard
3. See only your actions logged
4. Each entry shows: action, name, email, timestamp
```

---

## 🎯 Key Features to Test

- [ ] User signup with email verification
- [ ] User login redirects to /dashboard
- [ ] Moderator login rejects user accounts
- [ ] Admin login works with default credentials
- [ ] User history shows only their actions
- [ ] Moderator history excludes admin actions
- [ ] Admin history shows everything
- [ ] Dashboard shows correct stats for role
- [ ] Service creation is logged with name/email/timestamp
- [ ] Timestamps are accurate in history
- [ ] Role-based access control working

---

## 🛠️ Troubleshooting

### Backend Not Starting?
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Start with more logging
NODE_ENV=development npm run dev
```

### Frontend Not Connecting to Backend?
```
Check: src/lib/api.ts
Should have: const API_BASE_URL = 'http://localhost:3000'

Check: src/lib/socket.ts
Should have: const SOCKET_URL = 'http://localhost:3000'

Both must be 'localhost:3000' not 'localhost:3001'
```

### JWT Token Errors?
```
Make sure .env has:
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRE=30d
```

### Database Connection Failed?
```
Check .env:
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nearo
DB_USER=root
DB_PASSWORD=yourpassword

Ensure MySQL is running and database 'nearo' exists
```

---

## 📞 Support Info

### Default Credentials
- **Admin Email**: admin@example.com
- **Admin Password**: Admin123

### API Documentation
See: `API_DOCUMENTATION.md` in backend folder

### Database Schema
See: `src/db/database.js` for table definitions

### Integration Guide
See: `INTEGRATION_GUIDE.md` for detailed architecture

---

## ✅ System Status

| Component | Status | Details |
|-----------|--------|---------|
| Backend Server | ✅ Running | Port 3000 |
| Frontend Server | ✅ Running | Port 8080 |
| MySQL Database | ✅ Ready | Tables created |
| Redis Cache | ✅ Ready | Port 6379 |
| JWT Auth | ✅ Working | Roles configured |
| Audit Logging | ✅ Working | All actions logged |
| RBAC | ✅ Working | Middleware active |

---

**Last Updated**: January 26, 2025  
**System**: Complete & Ready for Testing  
**Status**: ✅ All Green

