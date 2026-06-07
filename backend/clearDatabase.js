import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Message from './models/Message.js';
import Group from './models/Group.js';

// Load environment variables
dotenv.config();

console.log('🗑️  Database Cleanup Utility\n');

const clearDatabase = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Show current counts
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    const groupCount = await Group.countDocuments();

    console.log('📊 Current Database Status:');
    console.log(`   Users: ${userCount}`);
    console.log(`   Messages: ${messageCount}`);
    console.log(`   Groups: ${groupCount}`);
    console.log('');

    if (userCount === 0 && messageCount === 0 && groupCount === 0) {
      console.log('✅ Database is already empty!');
      process.exit(0);
    }

    // Ask for confirmation (in production, you'd want actual user input)
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('');

    // Delete all records
    console.log('🗑️  Deleting all users...');
    const deletedUsers = await User.deleteMany({});
    console.log(`✅ Deleted ${deletedUsers.deletedCount} users`);

    console.log('🗑️  Deleting all messages...');
    const deletedMessages = await Message.deleteMany({});
    console.log(`✅ Deleted ${deletedMessages.deletedCount} messages`);

    console.log('🗑️  Deleting all groups...');
    const deletedGroups = await Group.deleteMany({});
    console.log(`✅ Deleted ${deletedGroups.deletedCount} groups`);

    console.log('');
    console.log('✅ ========================================');
    console.log('✅ DATABASE CLEARED SUCCESSFULLY!');
    console.log('✅ ========================================');
    console.log('');
    console.log('📊 Final Database Status:');
    console.log(`   Users: ${await User.countDocuments()}`);
    console.log(`   Messages: ${await Message.countDocuments()}`);
    console.log(`   Groups: ${await Group.countDocuments()}`);
    console.log('');
    console.log('💡 You can now register new users for testing');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ DATABASE CLEANUP FAILED!');
    console.error('❌ ========================================');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Troubleshooting:');
      console.error('   1. Make sure MongoDB is running');
      console.error('   2. Check MONGODB_URI in .env file');
      console.error('   3. Verify database connection');
    }
    
    console.error('');
    process.exit(1);
  }
};

// Run the cleanup
clearDatabase();
