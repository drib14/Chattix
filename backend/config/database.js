import mongoose from 'mongoose';

const connectDB = async (retryCount = 5, delayMs = 5000) => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ CRITICAL DATABASE ERROR: MONGODB_URI is missing in environment variables.');
    process.exit(1);
  }

  // Sanitize URI for logging (hide password)
  const sanitizedUri = uri.replace(/:([^@/]+)@/, ':****@');
  console.log(`📡 MongoDB URI (sanitized): ${sanitizedUri}`);

  // Connection options for production reliability
  const options = {
    serverSelectionTimeoutMS: 10000,  // Fail fast if cluster unreachable
    socketTimeoutMS: 45000,           // Close sockets after 45s inactivity
    family: 4,                        // Use IPv4 — avoids DNS issues on Render/Railway
    retryWrites: true,
    w: 'majority',
  };

  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      console.log(`🔌 Attempting MongoDB connection (Attempt ${attempt}/${retryCount})...`);
      const conn = await mongoose.connect(uri, options);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

      // Log connection events for debugging
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting reconnection...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully.');
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed.`);
      console.error(`   Error name: ${error.name}`);
      console.error(`   Error message: ${error.message}`);
      if (error.code) console.error(`   Error code: ${error.code}`);
      if (error.reason) console.error(`   Reason: ${JSON.stringify(error.reason)}`);

      if (attempt === retryCount) {
        console.error('❌ CRITICAL DATABASE ERROR: Max connection attempts reached. Server shutting down.');
        process.exit(1);
      }

      console.log(`⏱️ Waiting ${delayMs / 1000} seconds before retrying connection...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
};

export default connectDB;
