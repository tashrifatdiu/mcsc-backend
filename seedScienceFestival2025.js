// Run this script to add the Science Festival 2025 event
// Usage: node seedScienceFestival2025.js

require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./models/Event');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const scienceFestival2025 = {
  title: "Milestone College Science Festival 2025",
  slug: "milestone-college-science-festival-2025",
  date: new Date("2024-11-17"), // Start date of the festival
  location: "Milestone College Campus",
  shortDescription: "Four days of vibrant scientific exploration, innovation, and student-led creativity with 700+ participants",
  description: `The four-day Science Festival 2025 at Milestone College was successfully held from 17 to 20 November 2024. The event was primarily organized by the Milestone College Science Club, which had been working for months on planning, preparation, and smooth execution. The festival aimed not only to keep science and technology within the boundaries of textbooks but also to promote practical application, innovation, creative thinking, and problem-solving skills among students.

Pre-Festival Workshop
Before the main festival, a two-day Science Workshop was held on 29 and 30 October 2024 at the Milestone College permanent campus. The workshop welcomed distinguished guests including Principal Ziaul Alam of Milestone College and Professor & Proctor Dr. Sheikh Muhammad Allaiyar of Daffodil International University.

Day 1: Science Olympiad – 17 November
The festival began at 9:00 AM with the Science Olympiad. Students from Class 9 to Class 12 participated in two categories: Secondary and Higher Secondary. The Olympiad covered a wide range of subjects including Physics, Chemistry, Biology, Mathematics, Astronomy, and Programming. Alongside written tests, some categories included practical and quiz rounds. More than 700 students participated enthusiastically, establishing a strong start to the festival.

Day 2 & 3: Science Project Exhibition & Innovation Fair – 18 & 19 November
The second and third days featured a grand Science Project Exhibition and Innovation Fair on the college campus. A total of 125 projects were showcased—each designed and built entirely based on the students' own ideas, creativity, and technical skills.

Projects were categorized into five major divisions:
• Robotics & Automation
• Environment & Sustainable Development
• Health & Medical Technology
• Information Technology & Software Solutions
• Space Science & Astronomy

Notable Projects Included:
• Student Record Hub – a complete digital student management platform
• Voice-Controlled Wheelchair – operable through Bangla voice commands
• Smart Safety & Automation System
• Fast & Furious – a rapid-response fire detection and extinguishing system
• Real-time Plant Monitoring & Health Diagnostics System
• Chandrayaan Rover Model – capable of obstacle avoidance and sample collection

Project evaluation was conducted under the supervision of Professor Zahirul Haque, with judges including Vice Principals Shafiqul Islam & Iftikhar Hossain, Senior Director Abdul Hannan, Director Azizul Haque, and Chairman of Chemistry Department Mahmudur Rahman.

Day 4: Closing Ceremony & Prize Distribution – 20 November
The closing ceremony began at 10:00 AM with distinguished guests:
• Chief Guest: Colonel (Retd.) Nurunnabi – Founder & Chairman of Milestone College
• Special Guest: Principal Mohammad Ziaul Alam

Winners of the Olympiad and Project Exhibition were awarded crests, certificates, and prizes. The event concluded with vibrant cultural performances by students, celebrating unity, creativity, and progress.

Partners & Support
The festival was supported by:
• PFEC Global – Event Coordination Partner
• ATN Bangla – Media Partner (full coverage)
• Velvet Bites – Food Partner

The visiting delegation from BijnanChinta, one of the nation's leading science outreach organizations, spent two days reviewing the projects and engaging in discussions with participants.

Science Fair Top 10 – At a Glance
1st Place: Project No. 14 – Student Record Hub (Leader: Mahibuzzaman Siyam)
2nd Place: Project No. 82 – Voice Automated Wheelchair (Leader: Mariam Eva)
3rd Place: Project No. 54 – Smart Safety & Automation System (Leader: Tasfia Tabassum Priota)
4th Place: Project No. 39 – Fast & Furious (Leader: Ibadi)
5th Place: Project No. 09 – Plant Monitoring System (Leader: Tanzim Ahmed)
6th Place: Project No. 15 – Smart Laser Security (Leader: Abdullah Al Nasif)
7th Place: Project No. 79 – Aqua Nova (Leader: Diana)
8th Place: Project No. 40 – Recycle Area (Leader: Kamrun Nahar)
9th Place: Project No. 76 – Smart City (Leader: Jariya Tasnia)
10th Place: Project No. 49(B) – Rescue Rover (Leader: Dipayan Sarker)

Conclusion
The Science Festival 2025 is considered the largest and most successful event ever organized by the Milestone College Science Club. It significantly contributed to enhancing scientific research interest, technology-driven problem-solving skills, and teamwork among students. Organizers and participants strongly believe that such initiatives will play a crucial role in elevating the quality of science and technology education in Bangladesh.`,
  coverImage: "https://i.postimg.cc/d1SFZyJn/571367928_1260955279407173_8734322433805870327_n.jpg",
  images: [
    "https://i.postimg.cc/7ZsrWz2T/1000075427.jpg",
    "https://i.postimg.cc/ZnF1FvmB/1000075428.jpg",
    "https://i.postimg.cc/zvC1tPnd/1000075429.jpg",
    "https://i.postimg.cc/4N1gpq4t/1000075433.jpg",
    "https://i.postimg.cc/J7NVWvXR/1000075452.jpg",
    "https://i.postimg.cc/8zs0s07S/1000075453.jpg",
    "https://i.postimg.cc/d0kpNxFj/1000075454.jpg",
    "https://i.postimg.cc/JnJw0ddp/1000075456.jpg",
    "https://i.postimg.cc/t47M7MsJ/1000075457.jpg",
    "https://i.postimg.cc/Y9Bnn2bN/1000075458.jpg",
    "https://i.postimg.cc/KcNqf2LS/1000075460.jpg",
    "https://i.postimg.cc/28YYbrYm/1000075461.jpg",
    "https://i.postimg.cc/fyj6jSsn/1000075462.jpg",
    "https://i.postimg.cc/VkTHtWt5/1000075463.jpg",
    "https://i.postimg.cc/d1SFZyJn/571367928-1260955279407173-8734322433805870327-n.jpg",
    "https://i.postimg.cc/NMPt2HQn/573585253-1261746762661358-881878553485796222-n.jpg",
    "https://i.postimg.cc/bdcK10W0/IMG-0271.jpg",
    "https://i.postimg.cc/3J2wVt8F/IMG-0292.jpg",
    "https://i.postimg.cc/8k25Z2Vy/IMG-0415.jpg",
    "https://i.postimg.cc/mDrRrwWd/IMG-20251119-WA0001.jpg"
  ],
  color: "from-green-400 to-blue-600",
  glow: "shadow-green-500/50",
  status: "past"
};

async function seedScienceFestival() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if event already exists
    const existing = await Event.findOne({ slug: scienceFestival2025.slug });
    if (existing) {
      console.log('Science Festival 2025 event already exists. Updating...');
      await Event.findOneAndUpdate(
        { slug: scienceFestival2025.slug },
        scienceFestival2025,
        { new: true }
      );
      console.log('✅ Event updated successfully!');
    } else {
      // Create the event
      const event = new Event(scienceFestival2025);
      await event.save();
      console.log('✅ Science Festival 2025 event created successfully!');
    }

    console.log('Event:', scienceFestival2025.title);
    console.log('Slug:', scienceFestival2025.slug);
    console.log('Images:', scienceFestival2025.images.length);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding event:', error);
    process.exit(1);
  }
}

seedScienceFestival();
