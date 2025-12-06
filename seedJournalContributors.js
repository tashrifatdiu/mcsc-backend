// server/seedJournalContributors.js
require('dotenv').config();
const mongoose = require('mongoose');
const JournalContributor = require('./models/JournalContributor');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const contributors = [
  {
    name: 'Pushpita Abedin',
    code: '3709',
    class: '12',
    section: 'M',
    building: 'Girls Building 27',
    role: 'Developer Assistant',
    contribution: 'Helped developers create and design the journal section with valuable insights and feedback',
    profileImage: '',
    order: 1
  },
  {
    name: 'Sawda Saba',
    code: '3130',
    class: '12',
    section: 'D',
    building: 'Girls Building 27',
    role: 'Developer Assistant',
    contribution: 'Contributed to the development of the journal section with creative ideas and testing',
    profileImage: '',
    order: 2
  }
];

async function seedContributors() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing contributors
    await JournalContributor.deleteMany({});
    console.log('Cleared existing contributors');

    // Insert new contributors
    const result = await JournalContributor.insertMany(contributors);
    console.log(`✅ Successfully added ${result.length} journal contributors`);

    contributors.forEach(c => {
      console.log(`   - ${c.name} (Code: ${c.code}, Class: ${c.class}${c.section})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error seeding contributors:', err);
    process.exit(1);
  }
}

seedContributors();
