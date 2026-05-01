# Neighborly API Documentation - Stage 3

Complete API documentation for Neighborly Backend - National Scale Up - High Scale & Real Time.

## Base URL
```
http://localhost:3001
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

## Rate Limiting

- **Global**: 100 requests per 15 minutes per IP
- **Authentication**: 5 attempts per hour per IP
- **Search**: 50 searches per hour per user
- **Admin**: 1000 requests per hour per admin user
- **Password Reset**: 3 attempts per hour per email

---

## 📋 Complete Endpoint List

### 1. Health Check

#### GET /health
Check server status and features.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "stage": "3",
  "version": "v3",
  "message": "National Scale Up - High Scale & Real Time",
  "database": "MySQL",
  "features": {
    "authentication": true,
    "locationServices": true,
    "rbac": true,
    "rateLimiting": true,
    "advancedSearch": true,
    "realTimeMessaging": true,
    "pushNotifications": true,
    "caching": true,
    "readWriteSeparation": true,
    "auditLogs": true,
    "reputationEngine": true,
    "intelligentDiscovery": true
  }
}
```

---

## 🔐 Authentication Endpoints

### 2. Register User

#### POST /auth/register
Register a new user account.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "userId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Error (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
}
```

---

### 3. Login

#### POST /auth/login
Login and receive access tokens.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "is_verified": true
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

**Error (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 4. Refresh Token

#### POST /auth/refresh
Get a new access token using refresh token.

**Request:**
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "7d"
}
```

---

### 5. Logout

#### POST /auth/logout
Logout and invalidate refresh token.

**Request:**
```http
POST /auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

### 6. Verify Email

#### GET /auth/verify-email
Verify email address using token from email.

**Request:**
```http
GET /auth/verify-email?token=verification_token_from_email
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

**Error (400):**
```json
{
  "error": "Invalid or expired verification token"
}
```

---

### 7. Forgot Password

#### POST /auth/forgot-password
Request password reset email.

**Request:**
```http
POST /auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "If the email exists, a password reset link has been sent"
}
```

---

### 8. Reset Password

#### POST /auth/reset-password
Reset password using token from email.

**Request:**
```http
POST /auth/reset-password
Content-Type: application/json

{
  "token": "reset_token_from_email",
  "newPassword": "newpassword123"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

**Error (400):**
```json
{
  "error": "Invalid or expired reset token"
}
```

---

## 👤 User Endpoints

### 9. Get My Profile

#### GET /users/me
Get authenticated user's profile.

**Request:**
```http
GET /users/me
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "email_verified_at": "2024-01-01T00:00:00.000Z",
  "last_login_at": "2024-01-01T12:00:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 10. Update My Profile

#### PUT /users/me
Update authenticated user's profile.

**Request:**
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Updated",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Updated",
  "email": "newemail@example.com",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "updated_at": "2024-01-01T13:00:00.000Z"
}
```

---

## 🛠️ Service Endpoints

### 11. Create Service

#### POST /services
Create a new service listing.

**Request:**
```http
POST /services
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Plumbing Service",
  "description": "Professional plumbing services for homes and offices",
  "category": "Plumbing",
  "price": 50.00,
  "availability": "Mon-Fri 9am-5pm",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "neighborhood": "Downtown",
  "city": "Bangalore"
}
```

**Response (201):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Plumbing Service",
  "description": "Professional plumbing services for homes and offices",
  "category": "Plumbing",
  "price": "50.00",
  "availability": "Mon-Fri 9am-5pm",
  "latitude": "12.97160000",
  "longitude": "77.59460000",
  "s2_cell_id": "12345678901234567890",
  "neighborhood": "Downtown",
  "city": "Bangalore",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 12. Get Services

#### GET /services
List all active services with optional category filter.

**Request:**
```http
GET /services?category=Plumbing
```

**Response (200):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "provider_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Plumbing Service",
    "description": "Professional plumbing services",
    "category": "Plumbing",
    "price": "50.00",
    "availability": "Mon-Fri 9am-5pm",
    "city": "Bangalore",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 13. Get Service by ID

#### GET /services/:id
Get details of a specific service.

**Request:**
```http
GET /services/660e8400-e29b-41d4-a716-446655440000
```

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Plumbing Service",
  "description": "Professional plumbing services",
  "category": "Plumbing",
  "price": "50.00",
  "availability": "Mon-Fri 9am-5pm",
  "latitude": "12.97160000",
  "longitude": "77.59460000",
  "neighborhood": "Downtown",
  "city": "Bangalore",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 14. Update Own Service

#### PUT /services/:id
Update your own service (ownership required).

**Request:**
```http
PUT /services/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Plumbing Service",
  "price": 75.00,
  "description": "Updated description",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "city": "Bangalore"
}
```

**Note:** All fields are optional. Only include fields you want to update.

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "title": "Updated Plumbing Service",
  "price": "75.00",
  "description": "Updated description",
  "updated_at": "2024-01-01T14:00:00.000Z"
}
```

**Error (403):**
```json
{
  "error": "Insufficient permissions",
  "message": "You don't have permission to perform this action on this resource"
}
```

---

### 15. Delete Own Service

#### DELETE /services/:id
Delete your own service (ownership required).

**Request:**
```http
DELETE /services/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Service deleted successfully"
}
```

---

### 16. Report Service

#### POST /services/:id/report
Report an inappropriate service.

**Request:**
```http
POST /services/660e8400-e29b-41d4-a716-446655440000/report
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "This service contains inappropriate content or violates terms of service"
}
```

**Response (201):**
```json
{
  "message": "Service reported successfully"
}
```

---

## 🔍 Search Endpoints

### 17. Advanced Search

#### GET /search/services
Advanced service search with multiple filters.

**Request:**
```http
GET /search/services?category=Plumbing&neighborhood=Downtown&price_min=50&price_max=200&lat=12.9716&lng=77.5946&radius=10km&page=1&limit=20&sort=price&order=ASC
```

**Query Parameters:**
- `category` (optional) - Service category
- `neighborhood` (optional) - Neighborhood name
- `city` (optional) - City name
- `price_min` (optional) - Minimum price
- `price_max` (optional) - Maximum price
- `lat` (optional) - Latitude (required with lng)
- `lng` (optional) - Longitude (required with lat)
- `radius` (optional) - Search radius (e.g., "10km", "5km", default: "10km")
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20, max: 100)
- `sort` (optional) - Sort field: `created_at`, `price`, `title` (default: `created_at`)
- `order` (optional) - Sort order: `ASC`, `DESC` (default: `DESC`)

**Response (200):**
```json
{
  "services": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Plumbing Service",
      "category": "Plumbing",
      "price": "50.00",
      "latitude": "12.97160000",
      "longitude": "77.59460000",
      "neighborhood": "Downtown",
      "city": "Bangalore",
      "distance": 2.5,
      "provider_name": "John Doe"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  },
  "filters": {
    "category": "Plumbing",
    "neighborhood": "Downtown",
    "city": null,
    "price_min": 50,
    "price_max": 200,
    "location": {
      "lat": 12.9716,
      "lng": 77.5946,
      "radius": 10
    }
  }
}
```

---

### 18. Find Nearby Services

#### GET /search/nearby
Find services within a radius of a location.

**Request:**
```http
GET /search/nearby?lat=12.9716&lng=77.5946&radius=10km&category=Plumbing&limit=20
```

**Query Parameters:**
- `lat` (required) - Latitude
- `lng` (required) - Longitude
- `radius` (optional) - Search radius (default: "10km")
- `category` (optional) - Service category
- `limit` (optional) - Results limit (default: 20, max: 100)

**Response (200):**
```json
{
  "services": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "Plumbing Service",
      "category": "Plumbing",
      "price": "50.00",
      "latitude": "12.97160000",
      "longitude": "77.59460000",
      "distance": 2.5,
      "provider_name": "John Doe",
      "city": "Bangalore"
    }
  ],
  "location": {
    "lat": 12.9716,
    "lng": 77.5946,
    "radius": 10
  },
  "count": 1
}
```

---

### 19. Get Categories

#### GET /search/categories
Get all active service categories.

**Request:**
```http
GET /search/categories
```

**Response (200):**
```json
{
  "categories": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Plumbing",
      "description": "Plumbing services and repairs",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "name": "Electrical",
      "description": "Electrical work and repairs",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 20. Get Neighborhoods

#### GET /search/neighborhoods
Get neighborhoods with optional city filter.

**Request:**
```http
GET /search/neighborhoods?city=Bangalore
```

**Query Parameters:**
- `city` (optional) - Filter by city

**Response (200):**
```json
{
  "neighborhoods": [
    {
      "neighborhood": "Downtown",
      "city": "Bangalore",
      "service_count": 5
    },
    {
      "neighborhood": "Koramangala",
      "city": "Bangalore",
      "service_count": 3
    }
  ]
}
```

---

### 21. Get Cities

#### GET /search/cities
Get all cities with service counts.

**Request:**
```http
GET /search/cities
```

**Response (200):**
```json
{
  "cities": [
    {
      "city": "Bangalore",
      "service_count": 10
    },
    {
      "city": "Mumbai",
      "service_count": 5
    }
  ]
}
```

---

## 📅 Booking Endpoints

### 22. Create Booking

#### POST /bookings
Create a new service booking.

**Request:**
```http
POST /bookings
Content-Type: application/json

{
  "service_id": "660e8400-e29b-41d4-a716-446655440000",
  "seeker_id": "990e8400-e29b-41d4-a716-446655440000",
  "requested_time": "2024-01-25 10:00 AM"
}
```

**Response (201):**
```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "service_id": "660e8400-e29b-41d4-a716-446655440000",
  "seeker_id": "990e8400-e29b-41d4-a716-446655440000",
  "requested_time": "2024-01-25 10:00 AM",
  "status": "pending",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

**Error (400):**
```json
{
  "error": "Users cannot book their own services"
}
```

---

### 23. Get Bookings

#### GET /bookings
List bookings with optional user filter.

**Request:**
```http
GET /bookings?user_id=990e8400-e29b-41d4-a716-446655440000
```

**Query Parameters:**
- `user_id` (optional) - Filter by user ID (returns bookings where user is seeker or provider)

**Response (200):**
```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "service_id": "660e8400-e29b-41d4-a716-446655440000",
    "seeker_id": "990e8400-e29b-41d4-a716-446655440000",
    "requested_time": "2024-01-25 10:00 AM",
    "status": "pending",
    "service_title": "Plumbing Service",
    "category": "Plumbing",
    "seeker_name": "Jane Seeker",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## 👨‍💼 Admin/Moderator Endpoints

All admin endpoints require authentication and appropriate role permissions.

### User Management

### 24. Get All Users

#### GET /admin/users
List all users with filtering and pagination.

**Request:**
```http
GET /admin/users?page=1&limit=20&role=user&is_active=true&search=john
Authorization: Bearer <moderator_token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)
- `role` (optional) - Filter by role: `user`, `moderator`, `admin`
- `is_active` (optional) - Filter by active status: `true`, `false`
- `search` (optional) - Search by name or email

**Response (200):**
```json
{
  "users": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "is_active": true,
      "is_verified": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "last_login_at": "2024-01-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 25. Get User Details

#### GET /admin/users/:id
Get detailed information about a specific user.

**Request:**
```http
GET /admin/users/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "is_verified": true,
  "email_verified_at": "2024-01-01T00:00:00.000Z",
  "last_login_at": "2024-01-01T12:00:00.000Z",
  "suspended_until": null,
  "suspension_reason": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "stats": {
    "services_count": 5,
    "bookings_count": 10
  }
}
```

---

### 26. Suspend User

#### PUT /admin/users/:id/suspend
Suspend a user for a specified duration.

**Request:**
```http
PUT /admin/users/550e8400-e29b-41d4-a716-446655440000/suspend
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "duration_hours": 24,
  "reason": "Violation of terms of service"
}
```

**Response (200):**
```json
{
  "message": "User suspended successfully",
  "suspended_until": "2024-01-02T12:00:00.000Z"
}
```

---

### 27. Unsuspend User

#### PUT /admin/users/:id/unsuspend
Remove suspension from a user.

**Request:**
```http
PUT /admin/users/550e8400-e29b-41d4-a716-446655440000/unsuspend
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "message": "User unsuspended successfully"
}
```

---

### 28. Warn User

#### POST /admin/users/:id/warn
Send a warning to a user.

**Request:**
```http
POST /admin/users/550e8400-e29b-41d4-a716-446655440000/warn
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "reason": "Repeated policy violations"
}
```

**Response (201):**
```json
{
  "message": "Warning sent successfully",
  "warning_id": "bb0e8400-e29b-41d4-a716-446655440000"
}
```

---

### 29. Ban User (Admin Only)

#### DELETE /admin/users/:id/ban
Permanently ban a user (admin only).

**Request:**
```http
DELETE /admin/users/550e8400-e29b-41d4-a716-446655440000/ban
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Severe policy violation"
}
```

**Response (200):**
```json
{
  "message": "User banned successfully"
}
```

---

### 30. Update User Role (Admin Only)

#### PUT /admin/users/:id/role
Change a user's role (admin only).

**Request:**
```http
PUT /admin/users/550e8400-e29b-41d4-a716-446655440000/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "moderator"
}
```

**Valid roles:** `user`, `moderator`, `admin`

**Response (200):**
```json
{
  "message": "User role updated successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "moderator"
  }
}
```

---

### Service Moderation

### 31. Get Pending Services

#### GET /admin/services/pending
Get services awaiting moderation.

**Request:**
```http
GET /admin/services/pending?page=1&limit=20
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "services": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "title": "New Service",
      "description": "Service description",
      "category": "Plumbing",
      "price": "50.00",
      "provider_name": "John Doe",
      "provider_email": "john@example.com",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 32. Get Service Details (Admin/Moderator)

#### GET /admin/services/:id
Get detailed service information for moderation.

**Request:**
```http
GET /admin/services/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "provider_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Plumbing Service",
  "description": "Professional plumbing services",
  "category": "Plumbing",
  "price": "50.00",
  "availability": "Mon-Fri 9am-5pm",
  "latitude": "12.97160000",
  "longitude": "77.59460000",
  "neighborhood": "Downtown",
  "city": "Bangalore",
  "is_active": true,
  "moderated_at": null,
  "moderated_by": null,
  "provider_name": "John Doe",
  "provider_email": "john@example.com",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 33. Update Service (Admin/Moderator)

#### PUT /admin/services/:id
Update any service (moderator/admin only).

**Request:**
```http
PUT /admin/services/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "title": "Updated Service Title",
  "price": 60.00,
  "description": "Updated description",
  "is_active": true
}
```

**Response (200):**
```json
{
  "message": "Service updated successfully",
  "service": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "title": "Updated Service Title",
    "price": "60.00"
  }
}
```

---

### 34. Delete Service (Admin/Moderator)

#### DELETE /admin/services/:id
Delete any service (moderator/admin only).

**Request:**
```http
DELETE /admin/services/660e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "message": "Service deleted successfully"
}
```

---

### 35. Approve Service

#### PUT /admin/services/:id/approve
Approve a pending service.

**Request:**
```http
PUT /admin/services/660e8400-e29b-41d4-a716-446655440000/approve
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "message": "Service approved successfully"
}
```

---

### 36. Reject Service

#### PUT /admin/services/:id/reject
Reject a pending service.

**Request:**
```http
PUT /admin/services/660e8400-e29b-41d4-a716-446655440000/reject
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "reason": "Service does not meet quality standards"
}
```

**Response (200):**
```json
{
  "message": "Service rejected successfully"
}
```

---

### Reports Management

### 37. Get User Reports

#### GET /admin/reports
Get all user reports with filtering.

**Request:**
```http
GET /admin/reports?page=1&limit=20&status=pending
Authorization: Bearer <moderator_token>
```

**Query Parameters:**
- `page` (optional) - Page number
- `limit` (optional) - Results per page
- `status` (optional) - Filter by status: `pending`, `reviewed`, `resolved`, `dismissed`

**Response (200):**
```json
{
  "reports": [
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440000",
      "reported_user_id": "550e8400-e29b-41d4-a716-446655440000",
      "reported_by": "990e8400-e29b-41d4-a716-446655440000",
      "service_id": "660e8400-e29b-41d4-a716-446655440000",
      "reason": "Inappropriate content",
      "status": "pending",
      "reported_user_name": "John Doe",
      "reporter_name": "Jane Seeker",
      "reviewer_name": null,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "totalPages": 1
  }
}
```

---

### 38. Update Report Status

#### PUT /admin/reports/:id
Update the status of a user report.

**Request:**
```http
PUT /admin/reports/cc0e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <moderator_token>
Content-Type: application/json

{
  "status": "resolved"
}
```

**Valid statuses:** `pending`, `reviewed`, `resolved`, `dismissed`

**Response (200):**
```json
{
  "message": "Report status updated successfully"
}
```

---

### Category Management (Admin Only)

### 39. List Categories

#### GET /admin/categories
Get all categories (admin only).

**Request:**
```http
GET /admin/categories
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "categories": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Plumbing",
      "description": "Plumbing services and repairs",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 40. Create Category

#### POST /admin/categories
Create a new service category (admin only).

**Request:**
```http
POST /admin/categories
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Home Repair",
  "description": "General home repair services"
}
```

**Response (201):**
```json
{
  "id": "dd0e8400-e29b-41d4-a716-446655440000",
  "name": "Home Repair",
  "description": "General home repair services",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

---

### 41. Update Category

#### PUT /admin/categories/:id
Update a category (admin only).

**Request:**
```http
PUT /admin/categories/770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Plumbing & Water",
  "description": "Updated description",
  "is_active": true
}
```

**Response (200):**
```json
{
  "message": "Category updated successfully",
  "category": {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "name": "Plumbing & Water",
    "description": "Updated description"
  }
}
```

---

### 42. Delete Category

#### DELETE /admin/categories/:id
Delete a category (admin only).

**Request:**
```http
DELETE /admin/categories/770e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

---

### Moderator Management (Admin Only)

### 43. List Moderators

#### GET /admin/moderators
Get all moderators (admin only).

**Request:**
```http
GET /admin/moderators
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "moderators": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Moderator Name",
      "email": "moderator@example.com",
      "role": "moderator",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 44. Promote to Moderator

#### PUT /admin/moderators/:id/promote
Promote a user to moderator (admin only).

**Request:**
```http
PUT /admin/moderators/550e8400-e29b-41d4-a716-446655440000/promote
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "User promoted to moderator successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "moderator"
  }
}
```

---

### 45. Demote Moderator

#### PUT /admin/moderators/:id/demote
Demote a moderator to user (admin only).

**Request:**
```http
PUT /admin/moderators/550e8400-e29b-41d4-a716-446655440000/demote
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "message": "Moderator demoted to user successfully",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "user"
  }
}
```

---

### Analytics

### 46. Dashboard Statistics

#### GET /admin/analytics/dashboard
Get dashboard statistics (moderator/admin).

**Request:**
```http
GET /admin/analytics/dashboard
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "total_users": 1000,
  "active_users": 800,
  "total_services": 500,
  "active_services": 450,
  "pending_services": 10,
  "total_bookings": 2000,
  "pending_bookings": 50,
  "total_reports": 25,
  "pending_reports": 5,
  "users_growth": {
    "last_7_days": 50,
    "last_30_days": 200
  },
  "services_growth": {
    "last_7_days": 20,
    "last_30_days": 80
  }
}
```

---

### 47. User Statistics

#### GET /admin/analytics/users
Get detailed user statistics (moderator/admin).

**Request:**
```http
GET /admin/analytics/users
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "total_users": 1000,
  "by_role": {
    "user": 950,
    "moderator": 5,
    "admin": 1
  },
  "by_status": {
    "active": 800,
    "suspended": 50,
    "banned": 10
  },
  "verified_users": 750,
  "unverified_users": 250
}
```

---

### 48. Service Statistics

#### GET /admin/analytics/services
Get detailed service statistics (moderator/admin).

**Request:**
```http
GET /admin/analytics/services
Authorization: Bearer <moderator_token>
```

**Response (200):**
```json
{
  "total_services": 500,
  "active_services": 450,
  "pending_services": 10,
  "inactive_services": 40,
  "by_category": {
    "Plumbing": 100,
    "Electrical": 80,
    "Cleaning": 70
  },
  "by_city": {
    "Bangalore": 200,
    "Mumbai": 150,
    "Delhi": 100
  }
}
```

---

### 49. Export Analytics (Admin Only)

#### GET /admin/analytics/export
Export analytics data as CSV (admin only).

**Request:**
```http
GET /admin/analytics/export?type=users&format=csv
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `type` (optional) - Export type: `users`, `services`, `bookings` (default: `all`)
- `format` (optional) - Export format: `csv`, `json` (default: `csv`)

**Response (200):**
```
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics_export.csv"

id,name,email,role,created_at
...
```

---

### System Management (Admin Only)

### 50. Get System Config

#### GET /admin/system/config
Get system configuration (admin only).

**Request:**
```http
GET /admin/system/config
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "settings": {
    "maintenance_mode": false,
    "maintenance_message": null,
    "max_file_size": "10MB",
    "allowed_file_types": ["jpg", "png", "pdf"]
  }
}
```

---

### 51. Update System Config

#### PUT /admin/system/config
Update system configuration (admin only).

**Request:**
```http
PUT /admin/system/config
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "setting_key": "maintenance_message",
  "setting_value": "System maintenance in progress"
}
```

**Response (200):**
```json
{
  "message": "System configuration updated successfully"
}
```

---

### 52. Get System Logs

#### GET /admin/system/logs
Get system logs (admin only).

**Request:**
```http
GET /admin/system/logs?page=1&limit=20&level=error
Authorization: Bearer <admin_token>
```

**Query Parameters:**
- `page` (optional) - Page number
- `limit` (optional) - Results per page
- `level` (optional) - Log level: `info`, `warn`, `error`

**Response (200):**
```json
{
  "logs": [
    {
      "id": "ee0e8400-e29b-41d4-a716-446655440000",
      "level": "error",
      "message": "Database connection failed",
      "user_id": null,
      "action": "database_connection",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

### 53. Set Maintenance Mode

#### PUT /admin/system/maintenance
Enable or disable maintenance mode (admin only).

**Request:**
```http
PUT /admin/system/maintenance
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "enabled": true,
  "message": "System is under maintenance. Please try again later."
}
```

**Response (200):**
```json
{
  "message": "Maintenance mode updated successfully",
  "maintenance_mode": true
}
```

---

---

## 💬 Real-Time Messaging (Stage 3)

### WebSocket Connection

**Connection URL:**
```
ws://localhost:3001
```

**Auth:** Pass JWT token via `auth.token` or query param:
```javascript
const socket = io('http://localhost:3001', {
  auth: { token: '<access_token>' }
});
```

**Events:**
- `conversation:join` → `{ conversationId }`
- `message:send` → `{ conversationId?, receiverId, content, seekerId?, providerId?, serviceId? }`
- `message:sent` → `{ message }`
- `message:received` → `{ message }`

If `conversationId` is not provided, include `seekerId` and `providerId` to create a new conversation.

### Messaging REST Endpoints

#### GET /messages/conversations
List conversations for current user.

```http
GET /messages/conversations
Authorization: Bearer <token>
```

#### GET /messages/:conversationId
List messages in a conversation.

```http
GET /messages/:conversationId?page=1&limit=50
Authorization: Bearer <token>
```

---

## ⭐ Reviews & Reputation (Stage 3)

### Create Review

```http
POST /reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "booking_id": "booking-uuid",
  "rating": 5,
  "comment": "Great service!"
}
```

### List Provider Reviews

```http
GET /reviews/provider/:providerId?page=1&limit=20
```

### Get Reputation Score

```http
GET /reviews/reputation/:providerId
```

---

## 🔥 Discovery (Stage 3)

### Trending Services

```http
GET /discover/trending?city=Bangalore&neighborhood=Downtown&limit=20
```

### Recommended Services

```http
GET /discover/recommended?limit=20
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "services": [...],
  "basis": "bookings_and_searches",
  "insights": {
    "categories_from_bookings": 2,
    "categories_from_searches": 3,
    "preferred_locations": 1
  }
}
```

---

## 🔔 Notifications (Stage 3)

### List Notifications

#### GET /notifications
Get all notifications for the current user.

**Request:**
```http
GET /notifications?page=1&limit=20&unread_only=false
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Results per page (default: 20)
- `unread_only` (optional) - Filter only unread notifications (default: false)

**Response (200):**
```json
{
  "notifications": [
    {
      "id": "notification-uuid",
      "user_id": "user-uuid",
      "type": "message",
      "payload": {
        "conversationId": "conversation-uuid",
        "messageId": "message-uuid",
        "senderName": "John Doe"
      },
      "is_read": false,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### Get Unread Count

#### GET /notifications/unread-count
Get the count of unread notifications.

**Request:**
```http
GET /notifications/unread-count
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "unread_count": 5
}
```

---

### Mark Notification as Read

#### PUT /notifications/:id/read
Mark a specific notification as read.

**Request:**
```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Mark All Notifications as Read

#### PUT /notifications/read-all
Mark all notifications as read.

**Request:**
```http
PUT /notifications/read-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Delete Notification

#### DELETE /notifications/:id
Delete a notification.

**Request:**
```http
DELETE /notifications/:id
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### Save Push Subscription

#### POST /notifications/subscriptions
Save a push notification subscription for the current user.

**Request:**
```http
POST /notifications/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "base64-encoded-key",
      "auth": "base64-encoded-key"
    }
  }
}
```

**Response (201):**
```json
{
  "success": true,
  "subscription_id": "subscription-uuid",
  "message": "Push subscription saved"
}
```

---

### Remove Push Subscription

#### DELETE /notifications/subscriptions
Remove a push notification subscription.

**Request:**
```http
DELETE /notifications/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Push subscription removed"
}
```

---

### Get Notification Preferences

#### GET /notifications/preferences
Get notification preferences for the current user.

**Request:**
```http
GET /notifications/preferences
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user_id": "user-uuid",
  "messages_enabled": true,
  "bookings_enabled": true,
  "reviews_enabled": true,
  "promotions_enabled": false,
  "email_notifications": true,
  "push_notifications": true,
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

---

### Update Notification Preferences

#### PUT /notifications/preferences
Update notification preferences for the current user.

**Request:**
```http
PUT /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "messages_enabled": true,
  "bookings_enabled": false,
  "reviews_enabled": true,
  "promotions_enabled": false,
  "email_notifications": true,
  "push_notifications": true
}
```

**Response (200):**
```json
{
  "user_id": "user-uuid",
  "messages_enabled": true,
  "bookings_enabled": false,
  "reviews_enabled": true,
  "promotions_enabled": false,
  "email_notifications": true,
  "push_notifications": true,
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

---

## ⚙️ Stage 3 Configuration

### Redis (Offline messages, caching)
```
REDIS_URL=redis://localhost:6379
```

### Read/Write DB Separation
```
READ_DB_HOST=localhost
READ_DB_PORT=3306
READ_DB_USER=your_read_user
READ_DB_PASSWORD=your_read_password
READ_DB_NAME=neighbourly_stage2
```

### Web Push Notifications (VAPID keys)
```
# Generate using: npx web-push generate-vapid-keys
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:your-email@example.com
```

---

## ❌ Error Responses

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    }
  ]
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
  "error": "Insufficient permissions",
  "message": "You don't have permission to perform this action",
  "required": "services.moderate",
  "currentRole": "user"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Route GET /invalid not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
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

## 👥 Roles and Permissions

### User
- Create and manage own services
- Create and manage own bookings
- Search services
- Report services
- Update own profile

### Moderator
- All user permissions
- Moderate services (approve/reject/update/delete)
- View and handle reports
- Suspend/unsuspend users
- Warn users
- View analytics
- View all users

### Admin
- All moderator permissions
- Ban users permanently
- Manage moderators (promote/demote)
- Manage categories
- System configuration
- Export analytics
- View system logs
- Maintenance mode control

---

## 🌍 Location Services

Location-based queries use S2 Geometry for efficient spatial indexing. Services can be filtered by:
- **Radius-based discovery**: 5km, 10km, 25km, or custom radius
- **Bounding box queries**: Fast initial filtering
- **Distance sorting**: Results sorted by proximity
- **Multi-city support**: Search across multiple cities

### Supported Radius Formats
- `"10km"` - 10 kilometers
- `"5km"` - 5 kilometers
- `"25km"` - 25 kilometers
- `10` - 10 kilometers (numeric)

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- All prices are stored as DECIMAL(10,2) in the database
- Location coordinates use decimal degrees (latitude: -90 to 90, longitude: -180 to 180)
- UUIDs are used for all primary keys
- Pagination defaults: page=1, limit=20
- Maximum limit for pagination: 100 items per page

---

**Total Endpoints: 71**

**Stage 2 Status: ✅ COMPLETED**  
**Stage 3 Status: ✅ COMPLETED**
