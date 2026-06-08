import dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary } from "cloudinary";

// Read environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Debug logs removed to protect credentials

const hasSomeConfig = cloudName || apiKey || apiSecret;
const hasAllConfig = cloudName && apiKey && apiSecret;

// Check partial configuration
if (hasSomeConfig && !hasAllConfig) {
  const missing = [];

  if (!cloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!apiKey) missing.push("CLOUDINARY_API_KEY");
  if (!apiSecret) missing.push("CLOUDINARY_API_SECRET");

  console.error(
    `❌ Cloudinary is partially configured. Missing variables: ${missing.join(", ")}`
  );
}

// Initialize Cloudinary
if (!hasAllConfig) {
  console.warn(
    "⚠️ Cloudinary is not configured. Avatar and media upload features will be disabled."
  );
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log("✅ Cloudinary initialized successfully");
}

export const isCloudinaryConfigured = () => {
  return Boolean(hasAllConfig);
};

export default cloudinary;