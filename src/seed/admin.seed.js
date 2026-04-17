import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../db/index.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import { UserRole } from "../utils/constant.js";

dotenv.config({
  path: "./docker/.env",
});

const seedAdmin = async () => {
  try {
    console.log("Seeding admin...");
    await connectDB();

    const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingAdmin) {
      console.log("Admin already exists");
      return;
    }

    const existingProfile = await Profile.findOne({ email: process.env.ADMIN_EMAIL });

    if (existingProfile) {
      console.log("Profile already exists");
      return;
    }

    const admin = await User.create({
      name: process.env.ADMIN_NAME,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
      role: UserRole.ADMIN,
      isEmailVerified: true,
    });

    const profile = await Profile.create({
      email: process.env.ADMIN_EMAIL,
      username: process.env.ADMIN_USERNAME,
      user: admin._id,
    });

    console.log(`Admin is created: ${admin._id}`);
    console.log(`Profil is created: ${profile._id}`);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

seedAdmin();
