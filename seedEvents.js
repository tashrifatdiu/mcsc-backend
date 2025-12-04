// Run this script to seed the initial event data
// Usage: node seedEvents.js

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const initialEvent = {
  title: "Milestone College Science Club Excels at Jagadish Chandra Bose Birth Anniversary Science Festival",
  slug: "jagadish-chandra-bose-festival",
  date: new Date("2024-11-30"),
  location: "Jagadish Chandra Bose Festival Venue",
  shortDescription: "Excellence • Innovation • Celebration",
  description: `The Milestone College Science Club achieved remarkable success at the Jagadish Chandra Bose Birth Anniversary Science Festival held on 30 November 2024. The day-long event, organized in honor of the eminent scientist Acharya Jagadish Chandra Bose, featured model exhibitions, quizzes, speeches, and discussions highlighting his groundbreaking contributions to plant physiology, biophysics, microwave research, and modern scientific inquiry.

Participants from various institutions showcased their scientific skills and creativity. Among them, Milestone College delivered an outstanding performance across all major segments of the festival.

In the Project Show, Milestone secured the top three positions, with Building 01 winning first place, the Main Campus taking second place, and Building 27 earning third place. The club also dominated the Quiz Competition, where Building 27 swept all three positions—first, second, and third. Additionally, Building 05 secured first place in the Speech Competition, further strengthening the institution's overall success at the event.

Other institutions also displayed notable performances, with St. Joseph College achieving both second and third positions in their respective categories. The festival provided a vibrant platform for young learners to explore scientific ideas, present innovative projects, and engage in healthy academic competition.

Milestone College Science Club's achievements reflect the dedication and growing scientific enthusiasm of its students, marking another proud moment for the institution.`,
  coverImage: "https://i.postimg.cc/2jKBHknP/IMG_1871.avif",
  images: [
    "https://i.postimg.cc/5yhyft35/IMG_1897.avif",
    "https://i.postimg.cc/25rqqVfx/Whats_App_Image_2025_11_30_at_17_09_56_4d4fa990.jpg",
    "https://i.postimg.cc/HkQcsbF4/Whats_App_Image_2025_11_30_at_17_09_59_9f17ae58.jpg",
    "https://i.postimg.cc/YqPfmNXR/Whats_App_Image_2025_12_01_at_00_40_34_20869ba7.jpg",
    "https://i.postimg.cc/Z5yPP92b/Whats_App_Image_2025_11_30_at_23_08_43_ab92709c.jpg",
    "https://i.postimg.cc/L8zY6jGh/Whats_App_Image_2025_11_30_at_17_10_03_157d1daf.jpg",
    "https://i.postimg.cc/sgFGrTHs/Whats_App_Image_2025_11_30_at_17_10_05_3c2f0544.jpg",
    "https://i.postimg.cc/Wby6Jm90/Whats_App_Image_2025_12_01_at_00_40_54_b4f50e0a.jpg",
    "https://i.postimg.cc/rFHCtGh1/Whats_App_Image_2025_12_01_at_00_40_52_858f24b1.jpg",
    "https://i.postimg.cc/pXSYnQ0Y/Whats_App_Image_2025_12_01_at_00_40_36_ad841065.jpg"
  ],
  color: "from-indigo-400 to-purple-600",
  glow: "shadow-indigo-500/50",
  status: "past"
};

async function seedEvents() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if event already exists
    const existing = await Event.findOne({ slug: initialEvent.slug });
    if (existing) {
      console.log('Event already exists. Skipping...');
      await mongoose.connection.close();
      return;
    }

    // Create the event
    const event = new Event(initialEvent);
    await event.save();
    console.log('✅ Event seeded successfully!');
    console.log('Event:', event.title);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding events:', error);
    process.exit(1);
  }
}

seedEvents();
