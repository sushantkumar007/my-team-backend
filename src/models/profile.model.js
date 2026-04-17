import mongoose, { Schema } from "mongoose";

const profileSchema = new Schema(
  {
    username: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      require: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    about: {
      type: String,
    },
    skills: {
      type: [String],
    },
    projects: [
      {
        name: { type: String },
        description: { type: String },
        url: { type: String },
      },
    ],
    socialMedia: {
      github: { type: String },
      linkedin: { type: String },
      twitter: { type: String },
      peerlist: { type: String },
      hashnode: { type: String },
    },
    courses: {
      type: [String],
    },
  },
  { timestamps: true },
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
