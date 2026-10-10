require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// 1. Mandatory Environment Variables Validation (Fail Fast)
const cloudinarySecretVar = 'CLOUDINARY_API_SECRET';
const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  cloudinarySecretVar
];

const missingEnvVars = requiredEnvVars.filter((key) => {
  if (key === cloudinarySecretVar) {
    return !process.env[key] && !process.env.CLOUDINARY_SECRET;
  }
  return !process.env[key];
});

if (missingEnvVars.length > 0 && process.env.NODE_ENV !== 'test') {
  console.error('\n======================================================');
  console.error('❌ FATAL: Server startup aborted due to missing configuration!');
  console.error('Missing required environment variables:');
  missingEnvVars.forEach((v) => console.error(`  - ${v}`));
  console.error('Please configure these in your .env or Render dashboard.');
  console.error('======================================================\n');
  process.exit(1);
}

// 2. Initialize Express Application
const app = express();

// 3. Security & Utility Middlewares
app.use(helmet());

// Configure CORS allowlist
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:5000,http://localhost:5173,http://127.0.0.1:8080,http://127.0.0.1:5500';
const allowedOrigins = rawOrigins
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Exact match only. A suffix check would let an attacker-controlled
      // lookalike domain through: with "https://sayam.dev" allowlisted,
      // "https://evilsayam.dev" also ends with "sayam.dev" and would pass,
      // handing that origin the browser's CORS permission.
      const isAllowed =
        allowedOrigins.includes('*') || allowedOrigins.includes(origin);

      if (isAllowed || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS policy`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(compression());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// Serve public static assets if present
app.use(express.static(path.join(__dirname, '../public')));

// 4. Mount API Routes
const authRoutes = require('./routes/auth');
const carsRoutes = require('./routes/cars');
const buildsRoutes = require('./routes/builds');
const uploadsRoutes = require('./routes/uploads');
const healthRoutes = require('./routes/health');

// Health endpoint (exempt from rate limits for uptime monitors)
app.use('/api/health', healthRoutes);

// Auth routes (have their own stricter rate limiter)
app.use('/api/auth', authRoutes);

// General routes (protected by general apiLimiter in production)
if (process.env.NODE_ENV === 'production') {
  app.use('/api/cars', apiLimiter, carsRoutes);
  app.use('/api/builds', apiLimiter, buildsRoutes);
  app.use('/api/uploads', apiLimiter, uploadsRoutes);
} else {
  app.use('/api/cars', carsRoutes);
  app.use('/api/builds', buildsRoutes);
  app.use('/api/uploads', uploadsRoutes);
}

// 404 Route Handler for undefined API paths
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

// 5. Database Connection and Server Startup
const PORT = process.env.PORT || 5000;

let server;

if (require.main === module) {
  connectDB()
    .then(() => {
      server = app.listen(PORT, () => {
        console.log(`🚀 Car Tuning Backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
        console.log(`⚡ Health check available at http://localhost:${PORT}/api/health`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to database during startup:', err);
      process.exit(1);
    });
}

module.exports = app;
