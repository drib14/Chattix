import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const fixAvatars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const result = await User.updateMany(
      { avatar: { $regex: /avatar-default\.png/ } },
      { $set: { avatar: '' } }
    );

    console.log(`Updated ${result.modifiedCount} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

fixAvatars();
