const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';
console.log('Using MongoDB URI:', MONGO_URI.substring(0, 20) + '...');

const olympiadEvent = {
  title: 'National Online Inter-College Olympiad 2025',
  slug: 'national-online-inter-college-olympiad-2025',
  date: new Date('2099-12-31'), // Far future date - actual date not announced yet
  location: 'Online Platform (Nationwide)',
  shortDescription: 'A nationwide academic competition designed to bring together students from all districts of Bangladesh on a modern, secure, and fully online examination platform.',
  description: `
<h2>National Online Inter-College Olympiad 2025</h2>
<p><strong>Organized by Milestone College Science Club</strong></p>

<p>The National Online Inter-College Olympiad 2025 is a nationwide academic competition designed to bring together students from all districts of Bangladesh on a modern, secure, and fully online examination platform. This event aims to promote scientific thinking, digital literacy, and fair competition among college students across the country.</p>

<h3>Who Can Participate</h3>
<p>Students of Classes 11 and 12 from any college in Bangladesh.</p>

<h3>Competition Structure</h3>
<ul>
  <li>A total of 200 multiple-choice questions</li>
  <li>Questions displayed one at a time</li>
  <li>Strict timer for each response</li>
  <li>Secure, monitored exam environment</li>
  <li>Top 10 winners selected based on accuracy and response speed</li>
</ul>

<h3>Prizes and Recognition</h3>
<ul>
  <li>Total prize pool of 60,000 BDT</li>
  <li>Trophies for top scorers</li>
  <li>Digital certificates for all participants</li>
</ul>

<h3>Purpose of the Olympiad</h3>
<p>This initiative is designed to:</p>
<ul>
  <li>Strengthen scientific and analytical skills among students</li>
  <li>Provide equal access to a national-level competition</li>
  <li>Encourage adoption of secure digital learning systems</li>
  <li>Showcase talent from every district of Bangladesh</li>
</ul>

<h3>Platform Security and Technology</h3>
<p>Our examination system includes:</p>
<ul>
  <li>Secure login and protected registration</li>
  <li>Encrypted data handling</li>
  <li>Timer-enforced question flow</li>
  <li>Browser activity monitoring</li>
  <li>Automated anti-cheating mechanisms</li>
  <li>Device and tab-switching alerts</li>
</ul>

<h3>A Nationwide Opportunity</h3>
<p>This Olympiad provides a competitive platform for students preparing for university admissions or seeking to challenge themselves in a national academic event.</p>

<h3>Registration</h3>
<p>Registration will open soon. Further details will be announced shortly.</p>
  `,
  coverImage: 'https://via.placeholder.com/1200x600/1e293b/fbbf24?text=National+Online+Inter-College+Olympiad+2025', // Placeholder, will be replaced later
  images: [],
  color: 'from-blue-500 to-indigo-600',
  glow: 'shadow-blue-500/50',
  status: 'upcoming'
};

async function seedOlympiad() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if event already exists
    const existing = await Event.findOne({ slug: olympiadEvent.slug });
    if (existing) {
      console.log('Olympiad event already exists. Updating...');
      await Event.findByIdAndUpdate(existing._id, olympiadEvent);
      console.log('Olympiad event updated successfully!');
    } else {
      console.log('Creating new Olympiad event...');
      await Event.create(olympiadEvent);
      console.log('Olympiad event created successfully!');
    }

    console.log('\nEvent Details:');
    console.log('Title:', olympiadEvent.title);
    console.log('Slug:', olympiadEvent.slug);
    console.log('Date:', olympiadEvent.date);
    console.log('Location:', olympiadEvent.location);
    console.log('Status:', olympiadEvent.status);
    console.log('\nNote: Cover image is using a placeholder. You can update it later through the admin panel or database.');

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Olympiad event:', error);
    process.exit(1);
  }
}

seedOlympiad();
