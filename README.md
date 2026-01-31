# NearO - Hyperlocal Service Marketplace

![NearO Logo](https://via.placeholder.com/150x50/4F46E5/FFFFFF?text=NearO)

A full-stack hyperlocal service marketplace platform connecting service providers with seekers in their neighborhood. Built with Node.js, Express, MySQL, React, TypeScript, and Socket.io for real-time features.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Database Schema](#database-schema)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Key Features Implementation](#key-features-implementation)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**NearO** is a **National Scale-Up** service marketplace platform (Stage 3) that enables users to:
- **Discover** local services using advanced location-based search (S2 Geometry)
- **Book** services from trusted providers in their neighborhood
- **Chat** in real-time with service providers via WebSocket
- **Review & Rate** services to build trust and reputation
- **Earn** through service provision with built-in earnings tracking
- **Admin/Moderator** panel for platform management and moderation

The platform supports multi-city operations, intelligent discovery engines, reputation systems, and comprehensive admin controls.

---

## ✨ Features

### Core Features
- 🔐 **Authentication & Authorization**: JWT-based auth with role-based access control (User, Moderator, Admin)
- 📍 **Location-Based Services**: S2 Geometry-powered geospatial indexing for fast proximity search
- 🔍 **Advanced Search**: Multi-criteria search with category, location, price, and rating filters
- 💬 **Real-Time Messaging**: WebSocket-based chat between seekers and providers
- 🔔 **Push Notifications**: Web push notifications for bookings, messages, and updates
- ⭐ **Reviews & Ratings**: 5-star rating system with verified reviews
- 📊 **Reputation Engine**: Provider scoring based on reviews, completion rate, and activity
- 💰 **Earnings Dashboard**: Track earnings, bookings, and financial analytics
- 🎯 **Intelligent Discovery**: Personalized service recommendations based on history and preferences
- 📱 **Responsive UI**: Mobile-first design with modern UI components (shadcn/ui)

### Admin & Moderation
- 👥 **User Management**: View, suspend, activate, and manage user accounts
- 📝 **Service Moderation**: Review and moderate service listings
- 📈 **Analytics Dashboard**: Platform-wide analytics and insights
- ⚠️ **Report Management**: Handle user reports and disputes
- 🏷️ **Category Management**: Add, edit, and manage service categories
- 📋 **Audit Logs**: Complete audit trail of all admin actions

### Performance & Scalability
- ⚡ **Redis Caching**: Cached search results and frequently accessed data
- 🔄 **Read/Write Separation**: Separate database instances for read and write operations
- 🛡️ **Rate Limiting**: Tiered rate limiting (global, auth, search, admin)
- 🔒 **Security**: Helmet.js security headers, input validation, SQL injection protection
- 📊 **Database Views**: Optimized materialized views for analytics
- 🚀 **Queue System**: Background job processing for notifications and emails

---

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Database**: MySQL 8.0+
- **Cache**: Redis
- **Authentication**: JWT (jsonwebtoken)
- **Real-Time**: Socket.io
- **Validation**: Joi, express-validator
- **Email**: Nodemailer
- **Push Notifications**: web-push (Web Push Protocol)
- **Location**: s2-geometry for geospatial indexing
- **Security**: Helmet, bcrypt, CORS
- **File Upload**: Multer

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Library**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **HTTP Client**: Fetch API with custom wrapper
- **Real-Time**: Socket.io Client
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query (React Query)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

### DevOps & Tools
- **Version Control**: Git & GitHub
- **Process Manager**: PM2 (production)
- **Development**: Nodemon (backend), Vite Dev Server (frontend)
- **Testing**: Vitest (unit tests)
- **Linting**: ESLint
- **Code Formatting**: Prettier (recommended)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web App   │  │   Mobile    │  │   Admin     │         │
│  │  (React)    │  │  (Future)   │  │   Panel     │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼─────────────────┼─────────────────┼───────────────┘
          │                 │                 │
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────┐
│                      API Gateway Layer                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Express.js REST API                       │  │
│  │  - Rate Limiting    - Authentication                  │  │
│  │  - Validation       - CORS                            │  │
│  │  - Security Headers - Error Handling                  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────────┬──────────────────┘
               │                            │
               │                            │
┌──────────────▼──────────┐    ┌───────────▼──────────────────┐
│   Business Logic Layer  │    │   Real-Time Layer            │
│  ┌───────────────────┐  │    │  ┌────────────────────────┐  │
│  │   Controllers     │  │    │  │   Socket.io Server     │  │
│  │   - Auth          │  │    │  │   - Chat               │  │
│  │   - Services      │  │    │  │   - Notifications      │  │
│  │   - Bookings      │  │    │  │   - Presence           │  │
│  │   - Search        │  │    │  └────────────────────────┘  │
│  │   - Admin         │  │    └─────────────────────────────┘
│  └───────────────────┘  │
│  ┌───────────────────┐  │
│  │    Middleware     │  │
│  │   - Auth          │  │
│  │   - Permissions   │  │
│  │   - Validation    │  │
│  └───────────────────┘  │
└──────────┬──────────────┘
           │
┌──────────▼────────────────────────────────────────────────┐
│                    Data Layer                              │
│  ┌───────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  MySQL DB     │  │  Redis Cache │  │  File Storage  │ │
│  │  (Primary)    │  │  - Sessions  │  │  - Uploads     │ │
│  │  - Users      │  │  - Search    │  │  - Images      │ │
│  │  - Services   │  │  - Presence  │  │  - Documents   │ │
│  │  - Bookings   │  │              │  │                │ │
│  └───────────────┘  └──────────────┘  └────────────────┘ │
│  ┌───────────────┐                                         │
│  │  MySQL DB     │                                         │
│  │  (Read        │                                         │
│  │   Replica)    │                                         │
│  └───────────────┘                                         │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   External Services                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │    SMTP      │  │   Push       │  │   Unsplash API  │  │
│  │   (Email)    │  │   Service    │  │   (Images)      │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## 🗄 Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'moderator', 'admin') DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  suspended_until TIMESTAMP NULL,
  suspension_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_is_active (is_active)
);
```

#### Services Table
```sql
CREATE TABLE services (
  id VARCHAR(36) PRIMARY KEY,
  provider_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  availability TEXT NOT NULL,
  latitude DECIMAL(10,8) NULL,
  longitude DECIMAL(11,8) NULL,
  s2_cell_id BIGINT UNSIGNED NULL,
  neighborhood VARCHAR(255) NULL,
  city VARCHAR(255) NULL,
  is_active BOOLEAN DEFAULT TRUE,
  moderated_at TIMESTAMP NULL,
  moderated_by VARCHAR(36) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_s2_cell (s2_cell_id),
  INDEX idx_city (city),
  INDEX idx_category (category)
);
```

#### Bookings Table
```sql
CREATE TABLE bookings (
  id VARCHAR(36) PRIMARY KEY,
  service_id VARCHAR(36) NOT NULL,
  seeker_id VARCHAR(36) NOT NULL,
  requested_time VARCHAR(255) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status)
);
```

### Real-Time Communication

#### Conversations Table
```sql
CREATE TABLE conversations (
  id VARCHAR(36) PRIMARY KEY,
  seeker_id VARCHAR(36) NOT NULL,
  provider_id VARCHAR(36) NOT NULL,
  service_id VARCHAR(36) NULL,
  last_message_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seeker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (provider_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_conversation (seeker_id, provider_id, service_id)
);
```

#### Messages Table
```sql
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY,
  conversation_id VARCHAR(36) NOT NULL,
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('sent', 'delivered', 'read') DEFAULT 'sent',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation (conversation_id)
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSON NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_read (is_read)
);
```

### Reviews & Reputation

#### Reviews Table
```sql
CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY,
  booking_id VARCHAR(36) NOT NULL,
  reviewer_id VARCHAR(36) NOT NULL,
  reviewee_id VARCHAR(36) NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_review (booking_id, reviewer_id)
);
```

### Additional Tables
- `user_sessions` - JWT refresh token management
- `email_verifications` - Email verification tokens
- `password_resets` - Password reset tokens
- `user_reports` - User/service reporting system
- `user_warnings` - Moderation warnings
- `admin_action_logs` - Audit trail
- `notification_preferences` - User notification settings
- `user_push_subscriptions` - Web push subscriptions
- `user_search_history` - Search history for personalization
- `user_presence` - Online/offline status
- `system_settings` - Platform configuration
- `service_categories` - Service category management

---

## 📦 Installation

### Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: v18.x or higher ([Download](https://nodejs.org/))
- **MySQL**: 8.0 or higher ([Download](https://dev.mysql.com/downloads/))
- **Redis**: Latest stable version ([Download](https://redis.io/download))
- **Git**: For cloning the repository ([Download](https://git-scm.com/))
- **npm** or **bun**: Package manager (npm comes with Node.js)

### Clone Repository

```bash
git clone https://github.com/mwasiq11/NearO.git
cd NearO
```

---

## ⚙️ Configuration

### Backend Configuration

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Create `.env` file:**
```bash
cp .env.example .env
```

4. **Configure environment variables in `backend/.env`:**

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=nearo
DB_USER=root
DB_PASSWORD=your_mysql_password

# JWT Authentication
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_key_here
JWT_REFRESH_EXPIRE=30d

# SMTP Configuration (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_specific_password
FROM_EMAIL=your_email@gmail.com
FROM_NAME=NearO

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=500
AUTH_RATE_LIMIT_MAX=10
SEARCH_RATE_LIMIT_MAX=200

# Application
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
API_VERSION=v3

# Redis Configuration
REDIS_URL=redis://localhost:6379
# OR if Redis is in Docker:
# REDIS_URL=redis://redis:6379
```

5. **Set up MySQL Database:**

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE nearo;

# Exit MySQL
exit;
```

6. **Run Database Migrations:**

The database schema will be automatically created when you start the backend server for the first time. Alternatively, you can manually run migrations:

```bash
# Run all migrations
npm run migrate

# Or use the migration script
node src/db/run-migration.js
```

7. **Seed Default Admin Account (Optional):**

The system automatically creates a default admin account on first run:
- **Email**: `admin@example.com`
- **Password**: `Admin123`

**⚠️ IMPORTANT**: Change this password immediately after first login!

### Frontend Configuration

1. **Navigate to frontend directory:**
```bash
cd ../frontend
```

2. **Install dependencies:**
```bash
npm install
# or if using bun
bun install
```

3. **Create `.env.local` file:**
```bash
cp .env.local.example .env.local
```

4. **Configure environment variables in `frontend/.env.local`:**

```env
# API Configuration (automatically set, but you can override)
VITE_API_URL=http://localhost:3000

# Unsplash API Configuration (for service images - optional)
VITE_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
VITE_UNSPLASH_SECRET_KEY=your_unsplash_secret_key
VITE_UNSPLASH_APP_ID=your_app_id
```

**Note**: The Unsplash API keys are optional and only used for displaying placeholder images for services.

---

## 🚀 Running the Application

### Development Mode

You'll need to run **three separate terminals** for optimal development:

#### Terminal 1: Redis Server

```bash
# Start Redis server
redis-server

# Or if using Docker:
docker run -d -p 6379:6379 redis:latest

# Verify Redis is running
redis-cli ping
# Should return: PONG
```

#### Terminal 2: Backend Server

```bash
cd backend
npm run dev
# or
npm start

# Backend will start on http://localhost:3000
# Health check: http://localhost:3000/health
```

Expected output:
```
🚀 Stage 3 Backend running on http://localhost:3000
📍 Health check: http://localhost:3000/health
🗄️  Database: MySQL (nearo)
🔐 Authentication: JWT enabled
🌍 Location Services: S2 Geometry enabled
👥 RBAC: Role-based access control enabled
⚡ Rate Limiting: Active
💬 Real-Time Messaging: WebSocket enabled
🔔 Push Notifications: Enabled
⚡ Redis Caching: Enabled
```

#### Terminal 3: Frontend Development Server

```bash
cd frontend
npm run dev

# Frontend will start on http://localhost:8080
```

Expected output:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### Production Mode

#### Backend Production

```bash
cd backend

# Install PM2 globally (if not already installed)
npm install -g pm2

# Start backend with PM2
pm2 start src/app.js --name nearo-backend

# View logs
pm2 logs nearo-backend

# Monitor
pm2 monit

# Stop
pm2 stop nearo-backend

# Restart
pm2 restart nearo-backend
```

#### Frontend Production

```bash
cd frontend

# Build for production
npm run build

# The build output will be in frontend/dist/

# Serve using a static file server
npx serve -s dist -p 8080

# Or use Nginx/Apache to serve the dist folder
```

### Accessing the Application

Once all services are running:

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:3000](http://localhost:3000)
- **Health Check**: [http://localhost:3000/health](http://localhost:3000/health)
- **API Docs**: See [API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md)

### Default Login Credentials

#### Admin Account
- **Email**: `admin@example.com`
- **Password**: `Admin123`

#### Test User Accounts
Create your own accounts via the registration page or use the backend API.

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000
```

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_access_token>
```

### Rate Limiting

- **Global**: 500 requests per 15 minutes per IP
- **Authentication**: 10 attempts per hour per IP
- **Search**: 200 searches per hour per user
- **Admin**: 1000 requests per hour per admin user

### Complete API Endpoints

#### 🔐 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login and get tokens | No |
| POST | `/auth/logout` | Logout user | Yes |
| POST | `/auth/refresh` | Refresh access token | No |
| GET | `/auth/verify-email?token=...` | Verify email address | No |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |

#### 👤 User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update current user profile | Yes |
| DELETE | `/users/me` | Delete current user account | Yes |
| GET | `/users/:id` | Get user profile by ID | Yes |
| GET | `/users/:id/reviews` | Get user reviews | Yes |
| GET | `/users/:id/stats` | Get user statistics | Yes |

#### 🛠️ Service Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/services` | Create a new service | Yes |
| GET | `/services` | List all services | No |
| GET | `/services/:id` | Get service details | No |
| PUT | `/services/:id` | Update own service | Yes (Owner) |
| DELETE | `/services/:id` | Delete own service | Yes (Owner) |
| GET | `/services/my-services` | Get my services | Yes |
| POST | `/services/:id/activate` | Activate service | Yes (Owner) |
| POST | `/services/:id/deactivate` | Deactivate service | Yes (Owner) |

#### 📅 Booking Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/bookings` | Create a booking | Yes |
| GET | `/bookings` | List user bookings | Yes |
| GET | `/bookings/:id` | Get booking details | Yes |
| PUT | `/bookings/:id/approve` | Approve booking | Yes (Provider) |
| PUT | `/bookings/:id/reject` | Reject booking | Yes (Provider) |
| DELETE | `/bookings/:id` | Cancel booking | Yes (Seeker) |
| GET | `/bookings/provider/:providerId` | Get provider bookings | Yes |

#### 🔍 Search Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/search` | Advanced search services | No |
| GET | `/search/nearby` | Find nearby services (geospatial) | No |
| GET | `/search/categories` | Get service categories | No |
| GET | `/search/autocomplete` | Autocomplete suggestions | No |

**Search Query Parameters:**
- `q` - Search query string
- `category` - Filter by category
- `latitude` & `longitude` - User location
- `radius` - Search radius in km (default: 10)
- `minPrice` & `maxPrice` - Price range filter
- `minRating` - Minimum rating filter
- `city` - Filter by city
- `sortBy` - Sort by: `price`, `rating`, `distance`, `newest`
- `page` & `limit` - Pagination

#### 💬 Messaging Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/messages/conversations` | List user conversations | Yes |
| GET | `/messages/conversations/:id` | Get conversation messages | Yes |
| POST | `/messages` | Send a message | Yes |
| PUT | `/messages/:id/read` | Mark message as read | Yes |
| DELETE | `/messages/:id` | Delete message | Yes (Sender) |

**Real-Time Events (Socket.io):**
- `message:new` - New message received
- `message:read` - Message read by recipient
- `user:online` - User came online
- `user:offline` - User went offline
- `typing:start` - User started typing
- `typing:stop` - User stopped typing

#### ⭐ Review Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/reviews` | Create a review | Yes |
| GET | `/reviews/service/:serviceId` | Get service reviews | No |
| GET | `/reviews/user/:userId` | Get user reviews | No |
| PUT | `/reviews/:id` | Update own review | Yes (Author) |
| DELETE | `/reviews/:id` | Delete own review | Yes (Author) |

#### 🔔 Notification Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notifications` | List user notifications | Yes |
| PUT | `/notifications/:id/read` | Mark notification as read | Yes |
| PUT | `/notifications/read-all` | Mark all as read | Yes |
| DELETE | `/notifications/:id` | Delete notification | Yes |
| POST | `/notifications/subscribe` | Subscribe to push notifications | Yes |
| DELETE | `/notifications/unsubscribe` | Unsubscribe from push | Yes |

#### 🎯 Discovery Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/discover/recommended` | Get personalized recommendations | Yes |
| GET | `/discover/trending` | Get trending services | No |
| GET | `/discover/popular` | Get popular services | No |
| GET | `/discover/nearby` | Get nearby services | Yes |

#### 💰 Earnings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/earnings` | Get earnings summary | Yes |
| GET | `/earnings/transactions` | Get earning transactions | Yes |
| GET | `/earnings/stats` | Get earnings statistics | Yes |
| GET | `/earnings/export` | Export earnings report | Yes |

#### 📜 History Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/history/bookings` | Get booking history | Yes |
| GET | `/history/services` | Get service history | Yes |
| GET | `/history/searches` | Get search history | Yes |

#### 👑 Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/admin/dashboard` | Get admin dashboard stats | Yes (Admin) |
| GET | `/admin/users` | List all users | Yes (Admin) |
| PUT | `/admin/users/:id/suspend` | Suspend user | Yes (Admin) |
| PUT | `/admin/users/:id/activate` | Activate user | Yes (Admin) |
| DELETE | `/admin/users/:id` | Delete user | Yes (Admin) |
| GET | `/admin/services` | List all services | Yes (Admin) |
| PUT | `/admin/services/:id/moderate` | Moderate service | Yes (Moderator) |
| GET | `/admin/reports` | List user reports | Yes (Moderator) |
| PUT | `/admin/reports/:id/resolve` | Resolve report | Yes (Moderator) |
| GET | `/admin/categories` | List categories | Yes (Admin) |
| POST | `/admin/categories` | Create category | Yes (Admin) |
| PUT | `/admin/categories/:id` | Update category | Yes (Admin) |
| DELETE | `/admin/categories/:id` | Delete category | Yes (Admin) |
| GET | `/admin/analytics` | Get platform analytics | Yes (Admin) |
| GET | `/admin/audit-logs` | Get audit logs | Yes (Admin) |

For detailed request/response examples, see [backend/API_DOCUMENTATION.md](./backend/API_DOCUMENTATION.md).

---

## 📁 Project Structure

```
NearO/
├── backend/                      # Backend Node.js application
│   ├── src/
│   │   ├── app.js               # Main application entry point
│   │   ├── controllers/         # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── userController.js (users.js)
│   │   │   ├── serviceController.js (services.js)
│   │   │   ├── bookings.js
│   │   │   ├── messages.js
│   │   │   ├── reviews.js
│   │   │   ├── searchController.js
│   │   │   ├── adminController.js
│   │   │   ├── notificationsController.js
│   │   │   ├── discovery.js
│   │   │   ├── earnings.js
│   │   │   └── historyController.js
│   │   ├── routes/              # API route definitions
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── services.js
│   │   │   ├── bookings.js
│   │   │   ├── messages.js
│   │   │   ├── reviews.js
│   │   │   ├── search.js
│   │   │   ├── admin.js
│   │   │   ├── notifications.js
│   │   │   ├── discovery.js
│   │   │   ├── earnings.js
│   │   │   └── history.js
│   │   ├── middleware/          # Express middleware
│   │   │   ├── auth.js          # JWT authentication
│   │   │   ├── permissions.js   # RBAC authorization
│   │   │   ├── validation.js    # Input validation
│   │   │   ├── rateLimit.js     # Rate limiting
│   │   │   ├── advancedRateLimit.js
│   │   │   ├── security.js      # Security headers
│   │   │   ├── maintenance.js   # Maintenance mode
│   │   │   └── upload.js        # File upload handling
│   │   ├── db/                  # Database configuration
│   │   │   ├── database.js      # Connection pool & schema
│   │   │   ├── createViews.js   # Database views
│   │   │   ├── seed.js          # Database seeder
│   │   │   ├── run-migration.js
│   │   │   └── migrations/      # SQL migration files
│   │   │       ├── stage2_migration.sql
│   │   │       ├── stage3_migration.sql
│   │   │       ├── add_notifications.sql
│   │   │       └── enhanced_messaging.sql
│   │   ├── services/            # Business logic services
│   │   │   ├── emailService.js
│   │   │   └── pushNotificationService.js
│   │   ├── realtime/            # WebSocket handling
│   │   │   └── socket.js
│   │   ├── queue/               # Background jobs
│   │   │   └── redisClient.js
│   │   ├── workers/             # Background workers
│   │   │   └── notificationWorker.js
│   │   ├── cache/               # Caching layer
│   │   │   └── cache.js
│   │   ├── audit/               # Audit logging
│   │   │   └── logger.js
│   │   ├── config/              # Configuration files
│   │   │   └── permissions.js
│   │   └── utils/               # Utility functions
│   │       ├── jwt.js
│   │       ├── location.js      # S2 Geometry helpers
│   │       ├── s2-helpers.js
│   │       └── validationSchemas.js
│   ├── uploads/                 # User uploaded files
│   │   ├── profiles/
│   │   ├── services/
│   │   └── messages/
│   ├── .env                     # Environment variables
│   ├── .gitignore
│   ├── package.json
│   ├── API_DOCUMENTATION.md     # Complete API docs
│   └── README.md
│
├── frontend/                    # Frontend React application
│   ├── src/
│   │   ├── main.tsx            # Application entry point
│   │   ├── App.tsx             # Root component
│   │   ├── components/         # React components
│   │   │   ├── layout/
│   │   │   │   ├── DashboardLayout.tsx
│   │   │   │   └── AdminModeratorLayout.tsx
│   │   │   ├── common/
│   │   │   │   ├── Autocomplete.tsx
│   │   │   │   ├── Avatar.tsx
│   │   │   │   ├── CategoryCombobox.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── Loading.tsx
│   │   │   │   ├── Rating.tsx
│   │   │   │   ├── SearchAutocomplete.tsx
│   │   │   │   ├── MessageComponents.tsx
│   │   │   │   └── NotificationDropdown.tsx
│   │   │   └── ui/             # shadcn/ui components
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── dialog.tsx
│   │   │       ├── input.tsx
│   │   │       ├── select.tsx
│   │   │       ├── toast.tsx
│   │   │       └── ... (50+ UI components)
│   │   ├── pages/              # Page components
│   │   │   ├── Index.tsx       # Home page
│   │   │   ├── LandingPage.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── HistoryPage.tsx
│   │   │   ├── auth/           # Auth pages
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── dashboard/      # User dashboard pages
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── ServicesPage.tsx
│   │   │   │   ├── BookingsPage.tsx
│   │   │   │   ├── MessagesPage.tsx
│   │   │   │   ├── NotificationsPage.tsx
│   │   │   │   └── EarningsPage.tsx
│   │   │   ├── profile/        # Profile pages
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   └── EditProfilePage.tsx
│   │   │   ├── admin/          # Admin panel pages
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AdminUsersPage.tsx
│   │   │   │   ├── AdminServicesPage.tsx
│   │   │   │   ├── AdminCategoriesPage.tsx
│   │   │   │   ├── AdminAnalyticsPage.tsx
│   │   │   │   └── AdminAuditLogsPage.tsx
│   │   │   └── moderator/      # Moderator pages
│   │   │       ├── ModeratorDashboard.tsx
│   │   │       └── ModeratorReportsPage.tsx
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useBookings.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useListings.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useReviews.ts
│   │   │   ├── useEarnings.ts
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/                # Utility libraries
│   │   │   ├── api.ts          # API client
│   │   │   ├── socket.ts       # Socket.io client
│   │   │   └── utils.ts        # Helper functions
│   │   ├── store/              # Redux store
│   │   │   ├── store.ts
│   │   │   ├── hooks.ts
│   │   │   └── slices/
│   │   │       ├── authSlice.ts
│   │   │       ├── servicesSlice.ts
│   │   │       └── notificationsSlice.ts
│   │   ├── services/           # API service modules
│   │   │   └── unsplashService.ts
│   │   ├── models/             # TypeScript types
│   │   │   └── types.ts
│   │   ├── utils/              # Utility functions
│   │   │   ├── categoryEmojis.ts
│   │   │   ├── categoryImages.ts
│   │   │   ├── discoveryEngine.ts
│   │   │   ├── reputationEngine.ts
│   │   │   └── formatters.ts
│   │   ├── test/               # Unit tests
│   │   │   ├── setup.ts
│   │   │   └── example.test.ts
│   │   ├── App.css
│   │   ├── index.css           # Global styles
│   │   └── vite-env.d.ts
│   ├── public/
│   │   └── robots.txt
│   ├── .env.local              # Environment variables
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts          # Vite configuration
│   ├── tailwind.config.ts      # Tailwind CSS config
│   ├── tsconfig.json           # TypeScript config
│   ├── components.json         # shadcn/ui config
│   └── README.md
│
├── .git/                       # Git repository
├── ADMIN_LOGIN_TROUBLESHOOTING.md
├── ADMIN_MODERATOR_SYSTEM.md
└── README.md                   # This file
```

---

## 🔑 Key Features Implementation

### 1. Location-Based Search (S2 Geometry)

The platform uses Google's S2 Geometry library for efficient geospatial indexing:

```javascript
// Backend: Calculate S2 cell ID
import { S2 } from 's2-geometry';

const lat = 12.9716;
const lng = 77.5946;
const s2CellId = S2.latLngToKey(lat, lng, 16); // Level 16 for neighborhood precision

// Store in database
await connection.execute(
  'INSERT INTO services (..., s2_cell_id) VALUES (?, ?, ?, ?)',
  [serviceId, title, description, s2CellId]
);

// Search nearby services
const userCellId = S2.latLngToKey(userLat, userLng, 16);
const neighborCells = S2.getNeighbors(userCellId);

// Query services within cell and neighbor cells
const services = await connection.execute(
  'SELECT * FROM services WHERE s2_cell_id IN (?)',
  [neighborCells]
);
```

### 2. Real-Time Messaging (Socket.io)

WebSocket-based instant messaging:

```javascript
// Backend: Socket.io server
io.on('connection', (socket) => {
  socket.on('message:send', async (data) => {
    const message = await saveMessage(data);
    io.to(data.receiverId).emit('message:new', message);
  });
  
  socket.on('typing:start', (data) => {
    io.to(data.receiverId).emit('typing:start', data.senderId);
  });
});

// Frontend: Socket.io client
socket.on('message:new', (message) => {
  dispatch(addMessage(message));
  showNotification('New message received');
});

socket.emit('message:send', {
  conversationId,
  content,
  receiverId
});
```

### 3. Push Notifications (Web Push)

Web Push API implementation:

```javascript
// Backend: Send push notification
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

await webpush.sendNotification(subscription, JSON.stringify({
  title: 'New Booking',
  body: 'You have a new booking request',
  data: { bookingId: '123' }
}));

// Frontend: Subscribe to push
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY
});

// Send subscription to backend
await api.post('/notifications/subscribe', { subscription });
```

### 4. Redis Caching

Caching frequently accessed data:

```javascript
import { getCachedData, setCachedData } from './cache/cache.js';

// Cache search results
const cacheKey = `search:${query}:${category}:${location}`;
let results = await getCachedData(cacheKey);

if (!results) {
  results = await database.query(/* ... */);
  await setCachedData(cacheKey, results, 300); // 5 minutes TTL
}

return results;
```

### 5. JWT Authentication & Refresh Tokens

Secure authentication flow:

```javascript
// Backend: Generate tokens
const accessToken = jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '7d' });
const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: '30d' });

// Store refresh token hash
await connection.execute(
  'INSERT INTO user_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
  [uuid(), userId, hashToken(refreshToken), expiresAt]
);

// Frontend: Auto-refresh on 401
async function request(path, options) {
  const response = await fetch(path, options);
  
  if (response.status === 401 && !options.retry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return request(path, { ...options, retry: true });
    }
  }
  
  return response.json();
}
```

### 6. Advanced Rate Limiting

Tiered rate limiting per endpoint type:

```javascript
// Global rate limit: 500 req/15min
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: 'Too many requests'
});

// Auth rate limit: 10 req/hour
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true
});

// Search rate limit: 200 req/hour per user
const searchLimiter = advancedRateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  keyGenerator: (req) => req.user.id
});

app.use('/auth', authLimiter);
app.use('/search', searchLimiter);
```

### 7. Intelligent Discovery Engine

Personalized service recommendations:

```javascript
// Backend: Calculate recommendation score
const userHistory = await getUserSearchHistory(userId);
const userLocation = await getUserLocation(userId);
const userPreferences = await getUserPreferences(userId);

const recommendations = await getServices({
  categories: userHistory.frequentCategories,
  location: userLocation,
  excludeViewed: userHistory.viewedServices,
  sortBy: 'relevanceScore' // Custom algorithm
});

// Relevance scoring factors:
// - Category match (40%)
// - Distance (30%)
// - Provider reputation (20%)
// - Price match (10%)
```

### 8. Reputation Engine

Provider reputation scoring:

```javascript
// Calculate reputation score
const reputationScore = calculateReputation({
  averageRating: 4.5,        // Weight: 40%
  totalReviews: 50,          // Weight: 20%
  completionRate: 0.95,      // Weight: 25%
  responseTime: 2,           // Weight: 10% (hours)
  accountAge: 365            // Weight: 5% (days)
});

// Score formula
const score = (
  (averageRating / 5) * 0.40 +
  Math.min(totalReviews / 100, 1) * 0.20 +
  completionRate * 0.25 +
  (1 / Math.log10(responseTime + 1)) * 0.10 +
  Math.min(accountAge / 730, 1) * 0.05
) * 100;
```

---

## 🧪 Testing

### Backend Testing

```bash
cd backend

# Run tests
npm test

# Run specific test file
npm test -- auth.test.js

# Run with coverage
npm test -- --coverage
```

### Frontend Testing

```bash
cd frontend

# Run tests
npm test

# Run in watch mode
npm run test:watch

# Run with UI
npm test -- --ui
```

### Manual API Testing

Use tools like **Postman**, **Insomnia**, or **curl**:

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get profile (with auth token)
curl http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## 🚢 Deployment

### Backend Deployment

#### Option 1: Traditional VPS (Ubuntu/Debian)

```bash
# Install Node.js, MySQL, Redis
sudo apt update
sudo apt install nodejs npm mysql-server redis-server

# Clone repository
git clone https://github.com/mwasiq11/NearO.git
cd NearO/backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Edit with production values

# Setup database
mysql -u root -p
CREATE DATABASE nearo;

# Run migrations
npm run migrate

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start src/app.js --name nearo-backend
pm2 startup
pm2 save
```

#### Option 2: Docker Deployment

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "src/app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - DB_HOST=mysql
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mysql
      - redis

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: your_password
      MYSQL_DATABASE: nearo
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:latest
    ports:
      - "6379:6379"

volumes:
  mysql-data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d
```

### Frontend Deployment

#### Option 1: Static Hosting (Netlify/Vercel)

```bash
# Build for production
cd frontend
npm run build

# Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=dist

# Or Vercel
npm install -g vercel
vercel --prod
```

#### Option 2: Traditional Web Server (Nginx)

```bash
# Build
npm run build

# Copy to web server
scp -r dist/* user@server:/var/www/nearo/

# Nginx configuration
# /etc/nginx/sites-available/nearo
server {
    listen 80;
    server_name nearo.com;
    root /var/www/nearo;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site and restart Nginx
sudo ln -s /etc/nginx/sites-available/nearo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d nearo.com -d www.nearo.com

# Auto-renewal is configured automatically
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Style

- Follow existing code conventions
- Use ESLint for JavaScript/TypeScript
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### Reporting Bugs

Open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Authors

- **Muhammad Wasiq** - [mwasiq11](https://github.com/mwasiq11)

---

## 🙏 Acknowledgments

- [Express.js](https://expressjs.com/) - Backend framework
- [React](https://react.dev/) - Frontend library
- [Socket.io](https://socket.io/) - Real-time communication
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [S2 Geometry](https://s2geometry.io/) - Geospatial indexing
- [MySQL](https://www.mysql.com/) - Database
- [Redis](https://redis.io/) - Caching
- [Tailwind CSS](https://tailwindcss.com/) - Styling

---

## 📞 Support

For support, email muhammadwasiq67585@gmail.com or open an issue in the repository.

---

## 🔮 Future Roadmap

- [ ] Mobile apps (React Native)
- [ ] Payment gateway integration
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
- [ ] AI-powered service matching
- [ ] Video chat integration
- [ ] Service packages and subscriptions
- [ ] Loyalty rewards program
- [ ] API for third-party integrations
- [ ] White-label solution for enterprises

---

## 📊 Project Status

**Current Stage**: Stage 3 - National Scale-Up ✅  
**Version**: v3.0.0  
**Status**: Production Ready 🚀  
**Last Updated**: February 2026

---

<div align="center">

Made with ❤️ by the NearO Team

[⬆ Back to Top](#nearo---hyperlocal-service-marketplace)

</div>
