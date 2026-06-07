import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

console.log("MONGODB_URI:", process.env.MONGO_URI ? "Loaded" : "Missing");

try {
  const conn = await mongoose.connect(process.env.MONGO_URI);

  console.log("✅ Connected");
  console.log("Host:", conn.connection.host);

  process.exit(0);
} catch (err) {
  console.error("❌ Full Error:");
  console.error(err);
  process.exit(1);
}