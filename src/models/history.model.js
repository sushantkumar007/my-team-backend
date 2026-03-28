import mongoose, { Schema } from "mongoose";
import { HistoryActionsEnum } from "../utils/constant.js";

const requestSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
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

const Request = mongoose.model("Request", requestSchema);

export default Request;
