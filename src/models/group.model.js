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
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: UserRoleEnum,
          default: UserRole,
        },
        joindAt: {
          type: Date,
          default: Date.now(),
        },
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
