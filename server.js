require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const registrationRoutes = require('./routes/registrations');
const olympiadRoutes = require('./routes/olympiad');
const requestRoutes = require('./routes/registration-requests');

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Client for Token Verification
let supabase;
try {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('Supabase client initialized');
} catch (error) {
  console.error('Supabase init error:', error.message);
  process.exit(1);
}

// Middleware for CORS and JSON
app.use(cors());
app.use(express.json());

// JWT Verification Middleware (for Protected Routes)
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.split(' ')[1];
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ message: 'Invalid token' });
    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token verification failed' });
  }
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Error:', err));

// Routes
app.use('/api/register', registrationRoutes);
app.use('/api/olympiad', olympiadRoutes);
app.use('/api/request', verifyToken, requestRoutes); // Protected with token verification

app.get('/', (req, res) => {
  res.json({ message: 'MCSC Backend Ready' });
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});