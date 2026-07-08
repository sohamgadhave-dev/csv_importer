/**
 * MongoDB connection module with retry logic.
 * Uses Mongoose to connect to MongoDB Atlas (free M0 tier).
 */

import mongoose from 'mongoose';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;

/**
 * Connect to MongoDB with automatic retry on failure.
 * Exits the process if all retries are exhausted.
 */
export async function connectDB(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI is not set in environment variables');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('✅ Connected to MongoDB Atlas');
      return;
    } catch (error) {
      console.error(
        `❌ MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error instanceof Error ? error.message : error
      );

      if (attempt === MAX_RETRIES) {
        console.error('All MongoDB connection attempts exhausted. Exiting.');
        process.exit(1);
      }

      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/**
 * Gracefully close the MongoDB connection.
 */
export async function disconnectDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
}
