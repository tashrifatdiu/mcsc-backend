require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const registrationRoutes = require('./routes/registrations');
const olympiadRoutes = require('./routes/olympiad');
const requestRoutes = require('./routes/registration-requests'); // Full path

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

app.use('/api/register', registrationRoutes);
app.use('/api/olympiad', olympiadRoutes);
app.use('/api/request', requestRoutes); // New route for requests

app.get('/', (req, res) => {
  res.json({ message: 'Milestone Backend Ready' });
});

app.listen(PORT, () => {
  console.log(`Server on port ${PORT}`);
});