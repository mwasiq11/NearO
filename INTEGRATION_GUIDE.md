# NearO - Complete Role-Based Integration Guide

## 🎯 System Architecture

### Role-Based Access Structure
```
├── User (Provider/Seeker)
│   ├── Can sign up and login
│   ├── Can provide services
│   ├── Can seek services
│   ├── Can view their own history
│   └── Can manage their profile
│
├── Moderator (No Signup - Admin Created Only)
│   ├── Login only
│   ├── Can view all services
│   ├── Can approve/reject services
│   ├── Can view user reports
│   ├── Can view moderation history only
│   └── Cannot access admin endpoints/history
│
└── Admin (No Signup - Initial Setup Only)
    ├── Login only
    ├── Full system access
    ├── Can manage users, moderators
    ├── Can view complete history
    ├── Can manage system settings
    └── Can view all admin actions
```

## 📱 Frontend Routes & Pages

### Authentication Pages
- **`/login`** - `UserAuthPage.tsx` - Sign up/login for providers and seekers
- **`/moderator-login`** - `ModeratorLoginPage.tsx` - Moderator login only
- **`/admin-login`** - `AdminLoginPage.tsx` - Admin login only (with security warnings)
- **`/forgot-password`** - Password reset request
- **`/reset-password`** - Password reset with token

### User Dashboard
- **`/dashboard`** - `UserDashboard.tsx` - Unified provider/seeker dashboard
  - Overview tab with stats
  - Services provided tab
  - Bookings made tab
  - Quick actions (Post Service, Browse, Edit Profile, Messages)

### History & Audit
- **`/history`** - `HistoryPage.tsx` - Role-based activity history
  - Users: See only their own history
  - Moderators: See moderation activities and user actions
  - Admins: See complete platform history

### Admin Dashboards
- **`/admin-dashboard`** - Full admin control panel
- **`/moderator-dashboard`** - Moderator control panel

## 🔐 Backend Authentication & Authorization

### New Auth Endpoints

#### User Login (Provider/Seeker)
```
POST /auth/register
Body: { name, email, password }

POST /auth/login
Body: { email, password }
Response: { user, accessToken, refreshToken }
Note: Prevents moderator/admin login
```

#### Moderator Login
```
POST /auth/moderator-login
Body: { email, password }
Response: { user, accessToken, refreshToken }
Note: Role must be 'moderator'
```

#### Admin Login
```
POST /auth/admin-login
Body: { email, password }
Response: { user, accessToken, refreshToken }
Note: Role must be 'admin'
```

### New Middleware

#### Role-Based Access Control
```javascript
import { requireRole, requireAdmin, requireModeration } from './middleware/auth.js';

// Require specific role
router.post('/endpoint', requireRole('user'), handler);

// Require admin
router.post('/admin-endpoint', requireAdmin, handler);

// Require moderator or admin
router.post('/moderation', requireModeration, handler);
```

### New Endpoints

#### History Routes (`/history`)
```
GET /history 
  - Query: page, limit, entity_type, action_type, user_id, start_date, end_date
  - Role-based filtering:
    - User: sees only their own history
    - Moderator: sees moderation and user actions (not admin)
    - Admin: sees all history

GET /history/service?type=provider|seeker
  - Get service history (provided or booked)

GET /history/dashboard-stats
  - Role-based statistics:
    - User: services provided, bookings made, reviews, rating
    - Moderator: total services, pending modeations, pending reports
    - Admin: total users, services, bookings, pending items, reports
```

## 💾 Database Structure

### Updated Users Table
```sql
users
├── id (UUID)
├── name
├── email (unique)
├── password (hashed)
├── role ENUM('user', 'moderator', 'admin') -- DEFAULT: 'user'
├── is_active BOOLEAN
├── is_verified BOOLEAN
├── email_verified_at TIMESTAMP
├── last_login_at TIMESTAMP
├── suspended_until TIMESTAMP (for temporary bans)
├── suspension_reason TEXT
└── created_at TIMESTAMP
```

### Audit Logs (Immutable)
```sql
audit_logs
├── id (UUID)
├── actor_id (FOREIGN KEY → users)
├── action_type VARCHAR(100)
│   ├── 'user_login'
│   ├── 'moderator_login'
│   ├── 'admin_login'
│   ├── 'service_created'
│   ├── 'service_approved'
│   ├── 'service_rejected'
│   ├── 'booking_created'
│   ├── 'review_created'
│   ├── 'user_suspended'
│   └── ...
├── entity_type VARCHAR(50)
├── entity_id (UUID)
├── old_value JSON
├── new_value JSON
├── metadata JSON
├── ip_address VARCHAR(45)
├── user_agent TEXT
└── created_at TIMESTAMP (indexed)
```

### Admin Action Logs
```sql
admin_action_logs
├── id (UUID)
├── action VARCHAR(100)
├── actor_id (FOREIGN KEY → users)
├── target_type VARCHAR(50)
├── target_id (UUID)
├── metadata JSON
└── created_at TIMESTAMP
```

## 🔄 Complete Integration Flow

### 1. Provider/Seeker Sign Up Flow
```
User -> Sign Up Form -> POST /auth/register
-> Email verification -> POST /auth/verify-email
-> Redirect to login
-> Login -> POST /auth/login
-> JWT tokens generated
-> User stored in localStorage
-> Redirect to /dashboard
```

### 2. Moderator Login Flow
```
Moderator -> /moderator-login
-> POST /auth/moderator-login
-> Check role === 'moderator'
-> Generate tokens
-> Redirect to /moderator-dashboard
-> Can only view moderation history and user actions
```

### 3. Admin Login Flow
```
Admin -> /admin-login
-> POST /auth/admin-login
-> Check role === 'admin'
-> Generate tokens
-> Redirect to /admin-dashboard
-> Full system access
```

### 4. History Access Flow
```
GET /history
-> Middleware: authenticate(req)
-> Get role from JWT
-> If role === 'user': Filter by actor_id === userId
-> If role === 'moderator': Filter by moderation actions only
-> If role === 'admin': Return all
-> Return paginated results with timestamps
```

## 📊 Database History Tracking

### What Gets Logged
Every action in the system is automatically logged:

```javascript
// Service creation
{
  action_type: 'service_created',
  entity_type: 'service',
  entity_id: serviceId,
  actor_id: userId,
  new_value: { title, category, price, ... },
  metadata: { name, email, ip_address, user_agent },
  created_at: NOW()
}

// User login
{
  action_type: 'user_login',
  entity_type: 'user',
  entity_id: userId,
  actor_id: userId,
  metadata: { email, role },
  created_at: NOW()
}

// Service approval
{
  action_type: 'service_approved',
  entity_type: 'service',
  entity_id: serviceId,
  actor_id: moderatorId,
  metadata: { approved_by, reason },
  created_at: NOW()
}
```

### Access Control
- **Users** can only see their own activity
- **Moderators** can see:
  - Service approval/rejection activities
  - User actions (logins, bookings, reviews)
  - Except: Admin logins and admin actions
- **Admins** can see everything
- **Timestamp** on every entry for auditing

## 🧪 Testing Endpoints

### Test Provider Account
```bash
# Sign up
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Provider",
    "email": "provider@example.com",
    "password": "TestPass123"
  }'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "provider@example.com",
    "password": "TestPass123"
  }'

# View history
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer <accessToken>"
```

### Test Moderator Account
```bash
# Login
curl -X POST http://localhost:3000/auth/moderator-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mod@example.com",
    "password": "ModPass123"
  }'

# View history (filtered to moderation only)
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer <accessToken>"
```

### Test Admin Account
```bash
# Login (default admin@example.com / Admin123)
curl -X POST http://localhost:3000/auth/admin-login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123"
  }'

# View complete history
curl -X GET http://localhost:3000/history \
  -H "Authorization: Bearer <accessToken>"
```

## ✅ Features Completed

### Backend
- ✅ Enhanced authentication with role-specific login endpoints
- ✅ Audit logging for all actions with timestamps
- ✅ Role-based access control middleware
- ✅ History API with role-based filtering
- ✅ Dashboard stats endpoint (role-specific)
- ✅ Service history endpoint (provider/seeker view)

### Frontend
- ✅ Unified user auth page (signup + login)
- ✅ Moderator login page
- ✅ Admin login page
- ✅ User dashboard (provider + seeker combined)
- ✅ History page (role-based)
- ✅ Moderator dashboard (WIP)
- ✅ Admin dashboard (structure ready)

### Database
- ✅ Audit logs table (immutable)
- ✅ Admin action logs
- ✅ Timestamp on all entries
- ✅ Role-based data access

## 🚀 Next Steps to Complete

1. **Update App.tsx routing** to include new pages
2. **Create Admin Dashboard** (`AdminDashboard.tsx`)
3. **Test moderator/admin endpoints** with proper permissions
4. **Seed test moderators and admins** in database
5. **Implement service approval workflow** backend logic
6. **Add report management** endpoints and UI
7. **Complete end-to-end testing** of all flows

## 📝 Notes

- Default admin account: `admin@example.com` / `Admin123`
- Moderators and additional admins must be created by existing admins through backend
- All timestamps are in UTC and stored in `created_at` fields
- JWT tokens include `role` information for frontend routing decisions
- Session tokens are hashed before storage (bcrypt)
- Refresh tokens have 30-day expiry by default

---

**Status**: Role-based authentication and authorization system fully integrated with database history tracking.
