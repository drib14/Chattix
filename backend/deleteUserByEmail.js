import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Message from './models/Message.js';
import Group from './models/Group.js';

// Load environment variables
dotenv.config();

// Get email from command line argument
const emailToDelete = process.argv[2];

if (!emailToDelete) {
  console.error('❌ Error: Please provide an email address');
  console.error('');
  console.error('Usage: node deleteUserByEmail.js user@example.com');
  console.error('');
  process.exit(1);
}

console.log('🗑️  Delete User by Email\n');
console.log(`📧 Email to delete: ${emailToDelete}\n`);

const deleteUserByEmail = async () => {
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find user by email
    console.log('🔍 Searching for user...');
    const user = await User.findOne({ email: emailToDelete });

    if (!user) {
      console.log('❌ User not found with email:', emailToDelete);
      console.log('');
      console.log('💡 Tips:');
      console.log('   - Check if the email is correct');
      console.log('   - Email is case-sensitive');
      console.log('   - Make sure the user is registered');
      console.log('');
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log('');
    console.log('👤 User Details:');
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Mobile: ${user.mobileNumber}`);
    console.log(`   Verified: ${user.isVerified ? 'Yes' : 'No'}`);
    console.log(`   Created: ${user.createdAt}`);
    console.log('');

    // Count related data
    const sentMessages = await Message.countDocuments({ sender: user._id });
    const receivedMessages = await Message.countDocuments({ receiver: user._id });
    const userGroups = await Group.countDocuments({ members: user._id });
    const adminGroups = await Group.countDocuments({ admin: user._id });

    console.log('📊 Related Data:');
    console.log(`   Messages sent: ${sentMessages}`);
    console.log(`   Messages received: ${receivedMessages}`);
    console.log(`   Groups joined: ${userGroups}`);
    console.log(`   Groups admin: ${adminGroups}`);
    console.log('');

    // Delete user
    console.log('🗑️  Deleting user...');
    await User.findByIdAndDelete(user._id);
    console.log('✅ User deleted successfully!');

    // Delete related messages
    if (sentMessages > 0 || receivedMessages > 0) {
      console.log('🗑️  Deleting related messages...');
      await Message.deleteMany({
        $or: [{ sender: user._id }, { receiver: user._id }],
      });
      console.log(`✅ Deleted ${sentMessages + receivedMessages} messages`);
    }

    // Remove user from groups
    if (userGroups > 0) {
      console.log('🗑️  Removing user from groups...');
      await Group.updateMany(
        { members: user._id },
        { $pull: { members: user._id } }
      );
      console.log(`✅ Removed from ${userGroups} groups`);
    }

    // Delete groups where user is admin
    if (adminGroups > 0) {
      console.log('🗑️  Deleting groups where user is admin...');
      await Group.deleteMany({ admin: user._id });
      console.log(`✅ Deleted ${adminGroups} groups`);
    }

    console.log('');
    console.log('✅ ========================================');
    console.log('✅ USER DELETED SUCCESSFULLY!');
    console.log('✅ ========================================');
    console.log('');
    console.log(`📧 Email: ${emailToDelete}`);
    console.log('🗑️  All related data has been cleaned up');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ ========================================');
    console.error('❌ DELETE USER FAILED!');
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

// Run the delete
deleteUserByEmail();
