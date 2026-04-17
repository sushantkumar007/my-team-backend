import mongoose, { Schema } from "mongoose";
import { UserRole, UserRoleEnum } from "../utils/constant.js";

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      required: true,
    },
    members: [
      {
        profile: {
          type: Schema.Types.ObjectId,
          ref: "Profile",
          required: true,
        },
        role: {
          type: String,
          enum: UserRoleEnum,
          default: UserRole.MEMBER,
        },
        joindAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    notice: {
      type: String,
    },
  },
  { timestamps: true },
);

const Group = mongoose.model("Group", groupSchema);

export default Group;
