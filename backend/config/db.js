const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('FATAL: MONGODB_URI is not defined in environment variables.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      autoIndex: true
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
