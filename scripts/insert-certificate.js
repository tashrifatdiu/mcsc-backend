const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');

const MONGO_URI = 'mongodb://localhost:27017/mcsc';

const certificateData = {
  searchId: 'fd12n43n',
  name: 'Irfan Kahn',
  servingEvent: 'MCSC Science Fest-2025',
  code: '2849',
  class: 'XII',
  hscBatch: '2026',
};

async function insertCertificate() {
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const existing = await Certificate.findOne({ searchId: certificateData.searchId });
    if (existing) {
      console.log('Certificate already exists:', existing);
    } else {
      const certificate = new Certificate(certificateData);
      await certificate.save();
      console.log('Certificate inserted:', certificate);
    }
  } catch (err) {
    console.error('Error inserting certificate:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

insertCertificate();