import express from 'express';
import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();
console.log('Environment variables loaded');

// Global Uncaught Exception Handler
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down server...');
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Validate environment variables on startup
const isProduction = process.env.NODE_ENV === 'production';

// Critical environment variables required to boot up
const criticalEnvVars = ['MONGO_URI', 'ACCESS_TOKEN_SECRET'];
const missingCritical = criticalEnvVars.filter(varName => !process.env[varName]);

if (missingCritical.length > 0) {
  console.error('❌ CRITICAL ERROR: Missing critical environment variables:');
  missingCritical.forEach(varName => console.error(`   - ${varName}`));
  console.error('Please configure these in your .env file or deployment environment.');
  process.exit(1);
}

// Complete set of production-required environment variables
const productionRequiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'ACCESS_TOKEN_SECRET',
  'EMAIL_USER',
  'EMAIL_PASSWORD',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
];

const missingProduction = productionRequiredEnvVars.filter(varName => !process.env[varName]);

if (isProduction) {
  if (missingProduction.length > 0) {
    console.error('❌ CRITICAL PRODUCTION ERROR: Missing required environment variables for production:');
    missingProduction.forEach(varName => console.error(`   - ${varName}`));
    console.error('Application deployment failed due to missing environment configuration.');
    process.exit(1);
  }
  console.log('✅ All production environment variables are successfully configured.');
} else {
  if (missingProduction.length > 0) {
    console.warn('⚠️ WARNING: Missing recommended environment variables for development:');
    missingProduction.forEach(varName => console.warn(`   - ${varName}`));
  } else {
    console.log('✅ All environment variables are configured.');
  }
}

import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';
import { initializeSocket } from './socket/socketHandler.js';

// Import Cloudinary config to ensure it's initialized
import './config/cloudinary.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Import error middleware
import { errorHandler } from './middleware/errorMiddleware.js';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Parse CORS origins — supports comma-separated list for multiple frontends
const parseCorsOrigins = () => {
  const raw = process.env.FRONTEND_URL || (isProduction ? '' : 'http://localhost:3000');
  const origins = raw.split(',').map(o => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
};

const allowedCorsOrigins = parseCorsOrigins();

// Initialize Socket.IO with production-safe settings
const io = new Server(httpServer, {
  cors: {
    origin: allowedCorsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

// Middleware
app.use(cors({
  origin: allowedCorsOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Connect to Database (await so server doesn't accept traffic before DB is ready)
await connectDB();

// Initialize Socket.IO handlers
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/notifications', notificationRoutes);

// Health checks
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is healthy' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = parseInt(process.env.PORT, 10) || 10000;
const NODE_ENV = process.env.NODE_ENV || 'development';

httpServer.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = `Port ${PORT}`;

  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges.`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use. Please stop the other process or set a different PORT.`);
      process.exit(1);
      break;
    default:
      throw error;
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running in ${NODE_ENV} mode on port ${PORT}`);
  console.log(`Frontend origin allowed: ${allowedCorsOrigins}`);
});

// Global Unhandled Rejection Handler
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down server gracefully...');
  console.error(err instanceof Error ? `${err.name}: ${err.message}` : String(err));
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
  
  // Close HTTP server and then exit
  httpServer.close(() => {
    console.log('🚪 Server process exiting due to unhandled rejection.');
    process.exit(1);
  });

  // Force exit after 3 seconds if closing takes too long
  setTimeout(() => {
    console.error('❌ Forced exit due to unhandled rejection timeout.');
    process.exit(1);
  }, 3000);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`🔌 ${signal} signal received. Starting graceful shutdown...`);
  
  httpServer.close(async () => {
    console.log('🚪 HTTP server closed.');
    
    try {
      const mongoose = await import('mongoose');
      await mongoose.default.connection.close();
      console.log('📦 Database connection closed successfully.');
      process.exit(0);
    } catch (dbError) {
      console.error('❌ Error closing database connection:', dbError);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('❌ Forced shutdown due to shutdown timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
