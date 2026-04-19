import mongoose, { Schema } from "mongoose";
import { HistoryActionsEnum } from "../utils/constant.js";

const historySchema = new Schema(
  {
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
    },
    action: {
      type: String,
      enum: HistoryActionsEnum,
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true },
);

const History = mongoose.model("History", historySchema);

export default History;
