import './env.js';
import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './db/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import securityMiddleware from './middleware/security.js';
import { globalLimiter } from './middleware/rateLimit.js';
import maintenanceMiddleware from './middleware/maintenance.js';
import { initSocket } from './realtime/socket.js';
import { getRedisStatus } from './queue/redisClient.js';

// Routes
import userRoutes from './routes/users.js';
import serviceRoutes from './routes/services.js';
import bookingRoutes from './routes/bookings.js';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import adminRoutes from './routes/admin.js';
import messageRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';
import discoveryRoutes from './routes/discovery.js';
import notificationRoutes from './routes/notifications.js';
import historyRoutes from './routes/history.js';
import earningsRoutes from './routes/earnings.js';
import { startNotificationWorker } from './workers/notificationWorker.js';

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const API_VERSION = process.env.API_VERSION || 'v2';

// Security middleware (must be first)
app.use(securityMiddleware);

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:8081',
    'http://localhost:5173', 
    'https://nearo-six.vercel.app', // Your Vercel URL
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploads (no rate limiting on static files)
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://nearo-six.vercel.app'); // Update this
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(process.cwd(), 'uploads')));

// Maintenance mode middleware
app.use(maintenanceMiddleware);

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    stage: '3',
    version: API_VERSION,
    message: 'National Scale Up - High Scale & Real Time',
    database: 'Prisma/PostgreSQL',
    features: {
      authentication: true,
      locationServices: true,
      rbac: true,
      rateLimiting: true,
      advancedSearch: true,
      realTimeMessaging: true,
      pushNotifications: true,
      caching: true,
      readWriteSeparation: true,
      auditLogs: true,
      reputationEngine: true,
      intelligentDiscovery: true
    }
  });
});

// Apply global rate limiting AFTER health check
app.use(globalLimiter);

// API Routes
app.use('/auth', authRoutes);
app.use('/search', searchRoutes);
app.use('/users', userRoutes);
app.use('/services', serviceRoutes);
app.use('/bookings', bookingRoutes);
app.use('/admin', adminRoutes);
app.use('/messages', messageRoutes);
app.use('/reviews', reviewRoutes);
app.use('/discover', discoveryRoutes);
app.use('/notifications', notificationRoutes);
app.use('/history', historyRoutes);
app.use('/earnings', earningsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: {
      auth: '/auth',
      search: '/search',
      users: '/users',
      services: '/services',
      bookings: '/bookings',
      admin: '/admin'
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.details
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'Authentication token is invalid'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'Authentication token has expired'
    });
  }

  // Prisma unique constraint violation
  if (error.code === 'P2002') {
    return res.status(409).json({
      error: 'Duplicate Entry',
      message: 'A record with this information already exists'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? error.stack : 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

server.listen(PORT, async () => {
  const isNotificationsEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER);
  const isRateLimitingActive = !!process.env.RATE_LIMIT_MAX_REQUESTS;
  const dbStatus = 'Prisma Connected';
  const redisStatus = getRedisStatus();

  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🗄️ Database: ${dbStatus}`);
  console.log(`🔐 Authentication: JWT enabled`);
  console.log(`🌍 Location Services: Google Maps + S2 Geometry enabled`);
  console.log(`👥 RBAC: Role-based access control enabled`);
  console.log(`⚡ Rate Limiting: ${isRateLimitingActive ? 'Active' : 'Disabled'}`);
  console.log(`💬 Real-Time Messaging: WebSocket enabled`);
  console.log(`🔔 Push Notifications: ${isNotificationsEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`⚡ Redis Caching: ${redisStatus}`);

  // Test Prisma connection
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to database successfully');
  } catch (err) {
    console.error('❌ Prisma failed to connect to database:', err.message);
  }
});


// Initialize WebSocket server
initSocket(server);

// Start notification worker
startNotificationWorker().catch(err => {
  console.error('Failed to start notification worker:', err);
});
