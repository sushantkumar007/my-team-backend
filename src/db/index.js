import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const url = process.env.MONGO_URL;
    const instance = await mongoose.connect(url);
    console.log(`MongoDB connection success: ${instance.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
