// Remove legacy codeNo unique index from users collection
require('dotenv').config();
const mongoose = require('mongoose');

async function removeCodeNoIndex() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/mcsc';
  
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected successfully');

    // Get the users collection
    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    console.log(JSON.stringify(indexes, null, 2));

    // Drop the codeNo index if it exists
    const codeNoIndex = indexes.find(idx => 
      idx.key && idx.key.codeNo !== undefined
    );

    if (codeNoIndex) {
      console.log('\nDropping codeNo index:', codeNoIndex.name);
      await collection.dropIndex(codeNoIndex.name);
      console.log('Successfully dropped codeNo index');
    } else {
      console.log('\nNo codeNo index found');
    }

    // Verify indexes after
    console.log('\nRemaining indexes:');
    const remainingIndexes = await collection.indexes();
    console.log(JSON.stringify(remainingIndexes, null, 2));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

removeCodeNoIndex().catch(console.error);