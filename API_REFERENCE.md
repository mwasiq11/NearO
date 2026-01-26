# 📚 Complete API Documentation - NearO Role-Based System

## Base URL
```
http://localhost:3000
```

## Authentication
All endpoints except `/health` and auth endpoints require JWT token:
```
Authorization: Bearer <accessToken>
```

---

## 🔐 Authentication Endpoints

### 1. Register User (Provider/Seeker)
```
POST /auth/register
Content-Type: application/json

Request:
{
  "name": "John Provider",
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (201):
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "user-uuid"
}

Response (400):
{
  "error": "Email already registered"
}
```

### 2. Login User (Provider/Seeker)
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john@example.com",
  "password": "SecurePass123"
}

Response (200):
{
  "message": "Login successful",
  "user": {
    "id": "user-uuid",
    "name": "John Provider",
    "email": "john@example.com",
    "role": "user",
    "is_verified": true
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "expiresIn": "7d"
}

Response (401):
{
  "error": "Invalid email or password"
}

Response (403):
{
  "error": "Use the appropriate login portal for your role"
}
```

### 3. Moderator Login
```
POST /auth/moderator-login
Content-Type: application/json

Request:
{
  "email": "moderator@example.com",
  "password": "ModPass123"
}

Response (200):
{
  "message": "Moderator login successful",
  "user": {
    "id": "mod-uuid",
    "name": "Jane Moderator",
    "email": "moderator@example.com",
    "role": "moderator"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

Response (401):
{
  "error": "Invalid email or password"
}

Note: Only works with role='moderator' accounts
```

### 4. Admin Login
```
POST /auth/admin-login
Content-Type: application/json

Request:
{
  "email": "admin@example.com",
  "password": "Admin123"
}

Response (200):
{
  "message": "Admin login successful",
  "user": {
    "id": "admin-uuid",
    "name": "Admin",
    "email": "admin@example.com",
    "role": "admin"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}

Response (401):
{
  "error": "Invalid email or password"
}

Note: Only works with role='admin' accounts
```

### 5. Refresh Token
```
POST /auth/refresh
Content-Type: application/json

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "expiresIn": "7d"
}
```

### 6. Logout
```
POST /auth/logout
Authorization: Bearer <accessToken>

Response (200):
{
  "message": "Logout successful"
}
```

### 7. Verify Email
```
GET /auth/verify-email?token=abc123def456...

Response (200):
{
  "message": "Email verified successfully"
}

Response (400):
{
  "error": "Invalid or expired verification token"
}
```

### 8. Forgot Password
```
POST /auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "john@example.com"
}

Response (200):
{
  "message": "Password reset link sent to your email"
}
```

### 9. Reset Password
```
POST /auth/reset-password
Content-Type: application/json

Request:
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123"
}

Response (200):
{
  "message": "Password reset successfully"
}
```

---

## 📊 History & Audit Endpoints

### 1. Get Activity History
```
GET /history
Authorization: Bearer <accessToken>
Query Parameters:
  - page (int, default: 1)
  - limit (int, default: 50)
  - entity_type (string, optional: user, service, booking)
  - action_type (string, optional: created, updated, approved)
  - user_id (string, optional - admin only)
  - start_date (ISO date, optional)
  - end_date (ISO date, optional)

Example: /history?page=1&limit=20&entity_type=service&action_type=created

Response (200):
{
  "history": [
    {
      "id": "log-uuid",
      "actor_id": "user-uuid",
      "actor_name": "John Provider",
      "actor_email": "john@example.com",
      "action_type": "service_created",
      "entity_type": "service",
      "entity_id": "service-uuid",
      "old_value": null,
      "new_value": {
        "title": "Home Cleaning",
        "category": "Cleaning",
        "price": 50
      },
      "metadata": {
        "name": "John Provider",
        "email": "john@example.com"
      },
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-26T10:30:45.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}

Access Control:
- User role: Only sees their own history
- Moderator role: Sees moderation activities + user actions (NOT admin)
- Admin role: Sees all history
```

### 2. Get Service History
```
GET /history/service?type=provider|seeker
Authorization: Bearer <accessToken>
Query Parameters:
  - page (int, default: 1)
  - limit (int, default: 20)
  - type (required: 'provider' or 'seeker')

Example: /history/service?type=provider&page=1&limit=10

Provider Response (200):
{
  "services": [
    {
      "id": "service-uuid",
      "title": "Home Cleaning",
      "description": "Professional home cleaning",
      "category": "Cleaning",
      "price": 50,
      "created_at": "2025-01-26T10:30:45.000Z",
      "is_active": true,
      "booking_count": 5,
      "avg_rating": 4.8
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}

Seeker Response (200):
{
  "bookings": [
    {
      "booking_id": "booking-uuid",
      "service_id": "service-uuid",
      "title": "Home Cleaning",
      "category": "Cleaning",
      "price": 50,
      "status": "approved",
      "requested_time": "2025-01-27 14:00:00",
      "created_at": "2025-01-26T10:30:45.000Z",
      "provider_name": "John Provider",
      "provider_email": "john@example.com"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 8,
    "totalPages": 1
  }
}
```

### 3. Get Dashboard Statistics
```
GET /history/dashboard-stats
Authorization: Bearer <accessToken>

User Response (200):
{
  "role": "user",
  "stats": {
    "servicesProvided": 5,
    "bookingsMade": 12,
    "reviewsReceived": 3,
    "avgRating": 4.8
  }
}

Moderator Response (200):
{
  "role": "moderator",
  "stats": {
    "totalServices": 245,
    "pendingModerations": 8,
    "pendingReports": 3
  }
}

Admin Response (200):
{
  "role": "admin",
  "stats": {
    "totalUsers": 1250,
    "totalServices": 345,
    "totalBookings": 2340,
    "pendingModerations": 12,
    "pendingReports": 5
  }
}
```

---

## 🔑 Authorization Requirements

### Public Endpoints (No Auth Required)
```
GET  /health
POST /auth/register
POST /auth/login
POST /auth/moderator-login
POST /auth/admin-login
POST /auth/refresh
GET  /auth/verify-email
POST /auth/forgot-password
POST /auth/reset-password
```

### User Role Required
```
All authenticated endpoints except /admin/*
```

### Moderator Role Required
```
Moderator and Admin can access moderation endpoints
```

### Admin Role Required
```
POST /admin/*
GET  /admin/* (with full access)
```

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Email is required",
  "details": [...]
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please provide a valid authentication token"
}
```

### 403 Forbidden
```json
{
  "error": "Unauthorized",
  "message": "Only admins can access this resource"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Route POST /unknown not found"
}
```

### 409 Conflict
```json
{
  "error": "Duplicate Entry",
  "message": "A record with this information already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong!"
}
```

---

## 🧪 cURL Examples

### Sign Up
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Provider",
    "email": "alice@example.com",
    "password": "SecurePass123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "SecurePass123"
  }' | jq
```

### View History
```bash
curl -X GET "http://localhost:3000/history?page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Get Stats
```bash
curl -X GET http://localhost:3000/history/dashboard-stats \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }'
```

---

## 🔄 Role-Based Access Matrix

| Endpoint | User | Moderator | Admin |
|----------|------|-----------|-------|
| `/auth/register` | ✅ | ❌ | ❌ |
| `/auth/login` | ✅ | ❌ | ❌ |
| `/auth/moderator-login` | ❌ | ✅ | ✅ |
| `/auth/admin-login` | ❌ | ❌ | ✅ |
| `/history` | ✅ (own) | ✅ (moderation) | ✅ (all) |
| `/history/service` | ✅ | ❌ | ✅ |
| `/history/dashboard-stats` | ✅ | ✅ | ✅ |

---

## 📝 Data Types

### User Object
```json
{
  "id": "string (UUID)",
  "name": "string",
  "email": "string (email)",
  "role": "enum(user, moderator, admin)",
  "is_verified": "boolean",
  "is_active": "boolean",
  "created_at": "ISO 8601 timestamp",
  "last_login_at": "ISO 8601 timestamp"
}
```

### Audit Log Object
```json
{
  "id": "string (UUID)",
  "actor_id": "string (UUID)",
  "actor_name": "string",
  "actor_email": "string",
  "action_type": "string",
  "entity_type": "string",
  "entity_id": "string (UUID)",
  "old_value": "JSON object",
  "new_value": "JSON object",
  "metadata": "JSON object",
  "ip_address": "string (IP)",
  "user_agent": "string",
  "created_at": "ISO 8601 timestamp"
}
```

### Token Response
```json
{
  "accessToken": "string (JWT)",
  "refreshToken": "string (JWT)",
  "expiresIn": "string (e.g., '7d')"
}
```

---

**API Version**: v2  
**Last Updated**: January 26, 2025  
**Status**: ✅ Complete
