// Optimized Events Seed - Clean, Fast, Efficient
require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const optimizedEvents = [
  {
    title: "Jagadish Chandra Bose Birth Anniversary Science Festival",
    slug: "jagadish-chandra-bose-festival-2024",
    date: new Date("2024-11-30"),
    location: "BUET Graduates Club Ltd.",
    shortDescription: "Excellence • Innovation • Celebration",
    description: `The Milestone College Science Club achieved remarkable success at the Jagadish Chandra Bose Birth Anniversary Science Festival held on 30 November 2024.

The day-long event honored the eminent scientist Acharya Jagadish Chandra Bose, featuring model exhibitions, quizzes, speeches, and discussions highlighting his groundbreaking contributions to plant physiology, biophysics, microwave research, and modern scientific inquiry.

Outstanding Achievements:

Project Show Winners:
• 1st Place: Building 01
• 2nd Place: Main Campus
• 3rd Place: Building 27

Quiz Competition:
• Building 27 swept all three positions (1st, 2nd, and 3rd)

Speech Competition:
• 1st Place: Building 05

The festival provided a vibrant platform for young learners to explore scientific ideas, present innovative projects, and engage in healthy academic competition.

Milestone College Science Club's achievements reflect the dedication and growing scientific enthusiasm of its students, marking another proud moment for the institution.`,
    coverImage: "https://i.postimg.cc/2jKBHknP/IMG-1871.jpg",
    images: [
      "https://i.postimg.cc/25rqqVfx/Whats-App-Image-2025-11-30-at-17-09-56-4d4fa990.jpg",
      "https://i.postimg.cc/HkQcsbF4/Whats-App-Image-2025-11-30-at-17-09-59-9f17ae58.jpg",
      "https://i.postimg.cc/YqPfmNXR/Whats-App-Image-2025-12-01-at-00-40-34-20869ba7.jpg",
      "https://i.postimg.cc/Z5yPP92b/Whats-App-Image-2025-11-30-at-23-08-43-ab92709c.jpg",
      "https://i.postimg.cc/L8zY6jGh/Whats-App-Image-2025-11-30-at-17-10-03-157d1daf.jpg",
      "https://i.postimg.cc/sgFGrTHs/Whats-App-Image-2025-11-30-at-17-10-05-3c2f0544.jpg"
    ],
    color: "from-indigo-400 to-purple-600",
    glow: "shadow-indigo-500/50",
    status: "past"
  },
  {
    title: "Milestone College Science Festival 2024",
    slug: "milestone-college-science-festival-2024",
    date: new Date("2024-11-17"),
    location: "Milestone College Campus",
    shortDescription: "Four days of scientific exploration with 700+ participants",
    description: `The four-day Science Festival 2024 at Milestone College was successfully held from 17 to 20 November 2024, organized by the Milestone College Science Club.

Day 1: Science Olympiad (17 November)
Over 700 students from Class 9 to Class 12 participated in Physics, Chemistry, Biology, Mathematics, Astronomy, and Programming competitions.

Day 2 & 3: Science Project Exhibition (18-19 November)
125 innovative projects were showcased across five categories:
• Robotics & Automation
• Environment & Sustainable Development
• Health & Medical Technology
• Information Technology & Software Solutions
• Space Science & Astronomy

Top 10 Projects:
1. Student Record Hub - Mahibuzzaman Siyam
2. Voice-Controlled Wheelchair - Mariam Eva
3. Smart Safety & Automation System - Tasfia Tabassum Priota
4. Fast & Furious Fire Detection - Ibadi
5. Plant Monitoring System - Tanzim Ahmed
6. Smart Laser Security - Abdullah Al Nasif
7. Aqua Nova - Diana
8. Recycle Area - Kamrun Nahar
9. Smart City - Jariya Tasnia
10. Rescue Rover - Dipayan Sarker

Day 4: Closing Ceremony (20 November)
Chief Guest: Colonel (Retd.) Nurunnabi, Founder & Chairman of Milestone College
Special Guest: Principal Mohammad Ziaul Alam

Partners:
• PFEC Global - Event Coordination
• ATN Bangla - Media Coverage
• Velvet Bites - Food Partner

The festival significantly contributed to enhancing scientific research interest and technology-driven problem-solving skills among students.`,
    coverImage: "https://i.postimg.cc/d1SFZyJn/571367928-1260955279407173-8734322433805870327-n.jpg",
    images: [
      "https://i.postimg.cc/7ZsrWz2T/1000075427.jpg",
      "https://i.postimg.cc/ZnF1FvmB/1000075428.jpg",
      "https://i.postimg.cc/zvC1tPnd/1000075429.jpg",
      "https://i.postimg.cc/4N1gpq4t/1000075433.jpg",
      "https://i.postimg.cc/J7NVWvXR/1000075452.jpg",
      "https://i.postimg.cc/8zs0s07S/1000075453.jpg"
    ],
    color: "from-green-400 to-blue-600",
    glow: "shadow-green-500/50",
    status: "past"
  }
];

async function seedOptimizedEvents() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing events
    console.log('🗑️  Clearing old events...');
    await Event.deleteMany({});
    console.log('✅ Old events cleared');

    // Insert new optimized events
    console.log('📝 Inserting optimized events...');
    const inserted = await Event.insertMany(optimizedEvents);
    console.log(`✅ ${inserted.length} events inserted successfully!`);

    // Display summary
    console.log('\n📊 Events Summary:');
    inserted.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   Slug: ${event.slug}`);
      console.log(`   Images: ${event.images.length}`);
      console.log(`   Date: ${event.date.toLocaleDateString()}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    console.log('🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
}

seedOptimizedEvents();
