// scripts/insert-course.js
// Usage: node scripts/insert-course.js
// Ensure MONGO_URI env var is set or defaults to mongodb://localhost:27017/mcsc

const mongoose = require('mongoose');
const Course = require('../models/Course');

const courseData = {
  _id: new mongoose.Types.ObjectId('691cf38ccca7f18ad444325c'),
  title: 'Advanced Web Development',
  description: 'Learn modern web development with React and Node.js',
  modules: [
    {
      title: 'Module 1: Introduction to React',
      description: '',
      youtube: '',
      videos: [
        {
          id: 'video1',
          title: 'What is React?',
          duration: '12:45',
          content: 'React is a JavaScript library for building user interfaces with reusable components.',
          youtube_link: 'https://www.youtube.com/watch?v=1wZoGFF_oi4'
        },
        {
          id: 'video2',
          title: 'Components and Props',
          duration: '15:30',
          content: 'Learn how to create components and pass data through props.',
          youtube_link: 'https://www.youtube.com/watch?v=OGxojAD-x80'
        }
      ],
      questions: [
        { text: 'What is React?', options: ['CSS framework', 'JavaScript library', 'Design tool', 'Database'], answer: 'JavaScript library' },
        { text: 'React uses components that are:', options: ['Reusable', 'Non-reusable', 'Static', 'Fixed'], answer: 'Reusable' }
      ]
    },
    {
      title: 'Module 2: State and Hooks',
      description: '',
      youtube: '',
      videos: [
        {
          id: 'video3',
          title: 'Understanding useState',
          duration: '18:20',
          content: 'Master the useState hook for managing component state.',
          youtube_link: 'https://www.youtube.com/watch?v=4pO-HcG2igk'
        },
        {
          id: 'video4',
          title: 'useEffect and Side Effects',
          duration: '14:10',
          content: 'Learn how to handle side effects in functional components.',
          youtube_link: 'https://www.youtube.com/watch?v=gv9ugDJ1ynU'
        }
      ],
      questions: [
        { text: 'useState returns:', options: ['An object', 'An array', 'A string', 'A number'], answer: 'An array' },
        { text: 'State updates in React are:', options: ['Synchronous', 'Asynchronous', 'Random', 'Delayed'], answer: 'Asynchronous' }
      ]
    }
  ],
  quizzes: {
    video1: [
      { question: 'What is React?', options: ['CSS framework','JavaScript library','Design tool','Database'], correct: 1 },
      { question: 'React uses components that are:', options: ['Reusable','Non-reusable','Static','Fixed'], correct: 0 }
    ],
    video2: [
      { question: 'Props are used for:', options: ['Styling','Passing data','Animation','Routing'], correct: 1 },
      { question: 'Props can be passed from:', options: ['Child to parent','Parent to child','Sibling to sibling','Anywhere'], correct: 1 }
    ],
    video3: [
      { question: 'useState returns:', options: ['An object','An array','A string','A number'], correct: 1 },
      { question: 'State updates in React are:', options: ['Synchronous','Asynchronous','Random','Delayed'], correct: 1 }
    ],
    video4: [
      { question: 'useEffect runs:', options: ['Before render','After render','During render','Never'], correct: 1 },
      { question: 'Dependencies array controls:', options: ['Styling','When effect runs','Component render','Props'], correct: 1 }
    ]
  }
};

function parseArgs() {
  // allow: node scripts/insert-course.js --uri="mongodb..." or node scripts/insert-course.js mongodb://...
  const uriArg = process.argv.find(a => a.startsWith('--uri='));
  if (uriArg) return uriArg.split('=')[1];
  if (process.argv[2] && !process.argv[2].startsWith('-')) return process.argv[2];
  return null;
}

async function run() {
  const cliUri = parseArgs();
  const MONGO_URI = cliUri || process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';
  try {
    await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB:', MONGO_URI);

    // Upsert by _id (will create new or replace existing)
    const existing = await Course.findById(courseData._id);
    if (existing) {
      console.log('Course exists, updating...');
      existing.title = courseData.title;
      existing.description = courseData.description;
      existing.modules = courseData.modules.map(m => ({ title: m.title, description: m.description, youtube: m.youtube, questions: m.questions, videos: m.videos }));
      existing.quizzes = courseData.quizzes; // if Course schema doesn't include quizzes, this will be stored but may be ignored by model validation
      await existing.save();
      console.log('Course updated:', existing._id.toString());
    } else {
      console.log('Creating new course...');
      const course = new Course(courseData);
      await course.save();
      console.log('Course created:', course._id.toString());
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error inserting course:', err);
    try { await mongoose.disconnect(); } catch (e) {}
    process.exit(1);
  }
}

run();
