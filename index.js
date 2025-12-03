// server/index.js
// NOTE: This file is the same structure as your server bootstrap, with /api/journal mounted.
// Replace or merge this into your existing index.js, ensuring you keep other mounted routes unchanged.

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const registrationRoutes = require('./routes/registration');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const journalRoutes = require('./routes/journal');
const coursesRoutes = require('./routes/courses');
const certificatesRouter = require('./routes/certificates');
const ordersRouter = require('./routes/orders');

const app = express();

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB:', MONGO_URI);
}).catch(err => {
  console.error('MongoDB connection error:', err && err.message ? err.message : err);
  // Do not exit to allow debugging
});

// Mount routers
app.use('/api/registration', registrationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/certificates', certificatesRouter);
app.use('/api/orders', ordersRouter);

// health
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// 404
app.use((req, res) => res.status(404).json({ error: 'Not Found' }));

// error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err));
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));