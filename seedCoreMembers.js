// Run this script to seed the core members
// Usage: node seedCoreMembers.js

require('dotenv').config();
const mongoose = require('mongoose');
const CoreMember = require('./models/CoreMember');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const coreMembers = [
  {
    name: 'Colonel Nurun Nabi (Retd.)',
    role: 'Honorary Advisor',
    designation: 'Founder & Chairman, Milestone College',
    image: '', // Will be added later
    order: 1
  },
  {
    name: 'Mohammad Ziaul Alam',
    role: 'Honorary Advisor',
    designation: 'Principal, Milestone College',
    image: '', // Will be added later
    order: 2
  },
  {
    name: 'Mizanur Rahman Khanmizan',
    role: 'Honorary Moderator',
    designation: 'Vice Principal, Milestone College',
    image: '', // Will be added later
    order: 3
  }
];

async function seedCoreMembers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Clear existing core members
    await CoreMember.deleteMany({});
    console.log('Cleared existing core members');

    // Insert new core members
    const members = await CoreMember.insertMany(coreMembers);
    console.log('✅ Core members seeded successfully!');
    console.log(`Added ${members.length} core members:`);
    members.forEach(member => {
      console.log(`  - ${member.name} (${member.role})`);
    });

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding core members:', error);
    process.exit(1);
  }
}

seedCoreMembers();
