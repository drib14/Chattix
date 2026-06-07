import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';

// Load environment variables
dotenv.config();

console.log('📋 List All Users\n');

const listAllUsers = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users
    const users = await User.find({}).select('-password -otp -otpExpiry');
    
    if (users.length === 0) {
      console.log('📭 No users found in database');
      console.log('');
      console.log('💡 Register a new user to see them here');
      console.log('');
      process.exit(0);
    }

    console.log(`📊 Total Users: ${users.length}\n`);
    console.log('═'.repeat(80));
    console.log('');

    users.forEach((user, index) => {
      console.log(`👤 User #${index + 1}`);
      console.log('─'.repeat(80));
      console.log(`   Name:       ${user.fullName}`);
      console.log(`   Username:   ${user.username}`);
      console.log(`   Email:      ${user.email}`);
      console.log(`   Mobile:     ${user.mobileNumber}`);
      console.log(`   Verified:   ${user.isVerified ? '✅ Yes' : '❌ No'}`);
      console.log(`   Status:     ${user.status}`);
      console.log(`   Theme:      ${user.themePreference}`);
      console.log(`   Created:    ${new Date(user.createdAt).toLocaleString()}`);
      console.log(`   Last Seen:  ${new Date(user.lastSeen).toLocaleString()}`);
      console.log('');
    });

    console.log('═'.repeat(80));
    console.log('');
    console.log('💡 Commands:');
    console.log('   Delete user:     node deleteUserByEmail.js user@example.com');
    console.log('   Clear database:  node clearDatabase.js');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ LIST USERS FAILED!');
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

// Run the list
listAllUsers();
