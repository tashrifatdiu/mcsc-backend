// server/index.js
// NOTE: This file is the same structure as your server bootstrap, with /api/journal mounted.
// Replace or merge this into your existing index.js, ensuring you keep other mounted routes unchanged.

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const registrationRoutes = require('./routes/registration');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const journalRoutes = require('./routes/journal');
const coursesRoutes = require('./routes/courses');
const certificatesRouter = require('./routes/certificates');
const ordersRouter = require('./routes/orders');
const eventsRouter = require('./routes/events');
const coreMembersRouter = require('./routes/coreMembers');
const jacketPreOrdersRouter = require('./routes/jacketPreOrders');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development, configure properly in production
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan('combined'));

// CORS with options
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Stricter limit for write operations
  message: 'Too many requests, please try again later.'
});

// Apply rate limiting to all routes
app.use('/api/', limiter);

// Stricter limits for write operations
app.use('/api/journal', strictLimiter);
app.use('/api/registration', strictLimiter);
app.use('/api/orders', strictLimiter);

// Connect to MongoDB with optimized settings
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Connection pool size
  minPoolSize: 2,
  socketTimeoutMS: 45000,
  serverSelectionTimeoutMS: 5000,
  family: 4 // Use IPv4
}).then(() => {
  console.log('✅ Connected to MongoDB:', MONGO_URI);
  console.log('📊 Connection pool configured: min=2, max=10');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err && err.message ? err.message : err);
  // Do not exit to allow debugging
});

// MongoDB connection event handlers
mongoose.connection.on('error', err => {
  console.error('MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// Mount routers
app.use('/api/registration', registrationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/certificates', certificatesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/events', eventsRouter);
app.use('/api/core-members', coreMembersRouter);
app.use('/api/jacket-preorders', jacketPreOrdersRouter);

// Enhanced health check
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ ...health, status: 'error' });
  }
  
  res.json(health);
});

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));