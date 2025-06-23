const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  console.log('🔍 Testing MongoDB Atlas connection...');
  console.log('📡 Connection string:', process.env.MONGODB_URI ? '✅ Found' : '❌ Missing');
  
  if (!process.env.MONGODB_URI) {
    console.log('\n❌ MONGODB_URI not found in .env file');
    console.log('📝 Please create a .env file with your MongoDB Atlas connection string');
    console.log('📖 See MONGODB_ATLAS_SETUP.md for detailed instructions');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('🎉 Your database is ready for the Notes Sharing Platform');
    
    // Test creating a collection
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your MongoDB Atlas connection string');
    console.log('2. Verify your IP is whitelisted in Network Access');
    console.log('3. Ensure your database user has correct permissions');
    console.log('4. Check if your cluster is running');
    process.exit(1);
  }
}

testConnection(); 