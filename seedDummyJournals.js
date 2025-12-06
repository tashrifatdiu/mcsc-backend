const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const Journal = require('./models/Journal');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';

const journalTemplates = [
  {
    title: 'The Future of Artificial Intelligence in Education',
    bodyHtml: `
      <p>Artificial Intelligence is revolutionizing the way we learn and teach. From personalized learning experiences to automated grading systems, AI is transforming education at every level.</p>
      
      <h3>Key Benefits of AI in Education</h3>
      <ul>
        <li><strong>Personalized Learning:</strong> AI can adapt to each student's learning pace and style</li>
        <li><strong>Instant Feedback:</strong> Students receive immediate responses to their work</li>
        <li><strong>Accessibility:</strong> AI-powered tools make education more accessible to students with disabilities</li>
        <li><strong>Efficiency:</strong> Teachers can focus more on teaching and less on administrative tasks</li>
      </ul>
      
      <p>As we move forward, it's crucial to balance technological advancement with human interaction in education. The goal is not to replace teachers, but to empower them with better tools.</p>
      
      <blockquote>
        "The future of education is not about technology replacing teachers, but about technology empowering teachers to do what they do best - inspire and guide students."
      </blockquote>
    `,
    headerSize: 'h1',
    color: '#1e40af'
  },
  {
    title: 'Climate Change: A Scientific Perspective',
    bodyHtml: `
      <p>Climate change is one of the most pressing challenges facing humanity today. Understanding the science behind it is crucial for developing effective solutions.</p>
      
      <h3>The Greenhouse Effect</h3>
      <p>The Earth's atmosphere traps heat from the sun, creating a natural greenhouse effect that makes our planet habitable. However, human activities have intensified this effect by releasing excessive amounts of greenhouse gases.</p>
      
      <h3>Key Greenhouse Gases</h3>
      <ul>
        <li>Carbon Dioxide (CO₂) - from burning fossil fuels</li>
        <li>Methane (CH₄) - from agriculture and waste</li>
        <li>Nitrous Oxide (N₂O) - from industrial processes</li>
      </ul>
      
      <h3>What Can We Do?</h3>
      <p>Individual actions matter. By reducing our carbon footprint, supporting renewable energy, and advocating for policy changes, we can make a difference.</p>
      
      <p><em>The time to act is now. Our planet's future depends on the choices we make today.</em></p>
    `,
    headerSize: 'h2',
    color: '#059669'
  },
  {
    title: 'The Beauty of Mathematics: Exploring Fibonacci Sequence',
    bodyHtml: `
      <p>Mathematics is often called the language of the universe, and the Fibonacci sequence is one of its most beautiful expressions.</p>
      
      <h3>What is the Fibonacci Sequence?</h3>
      <p>The Fibonacci sequence is a series of numbers where each number is the sum of the two preceding ones: 0, 1, 1, 2, 3, 5, 8, 13, 21, 34...</p>
      
      <h3>Nature's Pattern</h3>
      <p>This sequence appears throughout nature:</p>
      <ul>
        <li>The spiral arrangement of sunflower seeds</li>
        <li>The pattern of pinecones</li>
        <li>The branching of trees</li>
        <li>The spiral of galaxies</li>
      </ul>
      
      <h3>The Golden Ratio</h3>
      <p>As the Fibonacci sequence progresses, the ratio between consecutive numbers approaches the golden ratio (φ ≈ 1.618), a proportion considered aesthetically pleasing and found in art, architecture, and design.</p>
      
      <blockquote>
        "Mathematics is the music of reason." - James Joseph Sylvester
      </blockquote>
    `,
    headerSize: 'h2',
    color: '#7c3aed'
  },
  {
    title: 'The Power of Critical Thinking in the Digital Age',
    bodyHtml: `
      <p>In an era of information overload and fake news, critical thinking has never been more important. It's the skill that separates informed citizens from those who are easily manipulated.</p>
      
      <h3>What is Critical Thinking?</h3>
      <p>Critical thinking is the ability to analyze information objectively and make reasoned judgments. It involves questioning assumptions, evaluating evidence, and considering alternative perspectives.</p>
      
      <h3>Key Components</h3>
      <ol>
        <li><strong>Analysis:</strong> Breaking down complex information into manageable parts</li>
        <li><strong>Evaluation:</strong> Assessing the credibility and relevance of information</li>
        <li><strong>Inference:</strong> Drawing logical conclusions from available evidence</li>
        <li><strong>Reflection:</strong> Examining your own thinking process and biases</li>
      </ol>
      
      <h3>Developing Critical Thinking Skills</h3>
      <p>Practice asking questions, seek diverse perspectives, and always verify information before accepting it as truth. In the digital age, these skills are essential for navigating the complex information landscape.</p>
    `,
    headerSize: 'h1',
    color: '#dc2626'
  },
  {
    title: 'Exploring Quantum Physics: The Weird World of the Very Small',
    bodyHtml: `
      <p>Quantum physics challenges our everyday understanding of reality. At the quantum level, particles behave in ways that seem impossible according to classical physics.</p>
      
      <h3>Key Quantum Phenomena</h3>
      
      <h4>Wave-Particle Duality</h4>
      <p>Light and matter exhibit both wave-like and particle-like properties. An electron can behave as both a particle and a wave, depending on how we observe it.</p>
      
      <h4>Quantum Superposition</h4>
      <p>A quantum particle can exist in multiple states simultaneously until it is measured. This is famously illustrated by Schrödinger's cat thought experiment.</p>
      
      <h4>Quantum Entanglement</h4>
      <p>Two particles can become "entangled," meaning the state of one instantly affects the state of the other, regardless of the distance between them. Einstein called this "spooky action at a distance."</p>
      
      <h3>Applications</h3>
      <p>Quantum physics isn't just theoretical - it's the foundation of modern technology including:</p>
      <ul>
        <li>Quantum computers</li>
        <li>Secure quantum communication</li>
        <li>Advanced medical imaging</li>
        <li>Precision sensors</li>
      </ul>
      
      <p><em>The quantum world reminds us that reality is far stranger and more wonderful than we ever imagined.</em></p>
    `,
    headerSize: 'h2',
    color: '#0891b2'
  },
  {
    title: 'The Art and Science of Effective Communication',
    bodyHtml: `
      <p>Communication is the cornerstone of human interaction. Whether in personal relationships, professional settings, or public speaking, effective communication can make all the difference.</p>
      
      <h3>The Communication Process</h3>
      <p>Effective communication involves more than just speaking or writing. It requires:</p>
      <ul>
        <li><strong>Clarity:</strong> Express your ideas clearly and concisely</li>
        <li><strong>Active Listening:</strong> Truly hear what others are saying</li>
        <li><strong>Empathy:</strong> Understand the perspective of your audience</li>
        <li><strong>Feedback:</strong> Ensure your message was understood correctly</li>
      </ul>
      
      <h3>Barriers to Communication</h3>
      <p>Common obstacles include:</p>
      <ol>
        <li>Language and cultural differences</li>
        <li>Emotional barriers and biases</li>
        <li>Physical distractions</li>
        <li>Information overload</li>
      </ol>
      
      <h3>Improving Your Communication Skills</h3>
      <p>Practice makes perfect. Seek feedback, observe skilled communicators, and continuously work on both your verbal and non-verbal communication skills.</p>
      
      <blockquote>
        "The single biggest problem in communication is the illusion that it has taken place." - George Bernard Shaw
      </blockquote>
    `,
    headerSize: 'h1',
    color: '#ea580c'
  }
];

async function seedDummyJournals() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB\n');

    // Fetch all users
    const users = await User.find().limit(3).lean();
    
    if (users.length === 0) {
      console.log('No users found in the database. Please create users first.');
      process.exit(1);
    }

    console.log(`Found ${users.length} user(s):\n`);
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name} (${user.email || 'No email'})`);
    });
    console.log('\n');

    // Create journals
    const journalsToCreate = [];
    
    journalTemplates.forEach((template, index) => {
      // Assign journals to users in a round-robin fashion
      const user = users[index % users.length];
      
      journalsToCreate.push({
        ...template,
        authorSupabaseId: user.supabaseId,
        authorEmail: user.email || '',
        authorName: user.name,
        isDraft: false,
        approved: true,
        approvedBy: 'admin',
        approvedAt: new Date(),
        publishedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      });
    });

    // Delete existing dummy journals (optional)
    console.log('Clearing existing journals...');
    await Journal.deleteMany({});
    
    // Insert new journals
    console.log('Creating dummy journals...\n');
    const created = await Journal.insertMany(journalsToCreate);
    
    console.log(`✅ Successfully created ${created.length} journals!\n`);
    
    // Display summary
    console.log('Journal Summary:');
    console.log('================');
    created.forEach((journal, i) => {
      console.log(`\n${i + 1}. "${journal.title}"`);
      console.log(`   Author: ${journal.authorName}`);
      console.log(`   Published: ${journal.publishedAt.toLocaleDateString()}`);
      console.log(`   Status: ${journal.approved ? 'Approved ✓' : 'Pending'}`);
    });

    await mongoose.connection.close();
    console.log('\n\nDatabase connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding journals:', error);
    process.exit(1);
  }
}

seedDummyJournals();
