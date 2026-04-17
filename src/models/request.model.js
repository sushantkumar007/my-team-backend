import mongoose, { Schema } from "mongoose";
import { RequestStatus, RequestStatusEnum, RequestTypeEnum } from "../utils/constant.js";

const requestSchema = new Schema(
  {
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
      required: true,
    },
    group: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    requestType: {
      type: String,
      enum: RequestTypeEnum,
      required: true,
    },
    status: {
      type: String,
      enum: RequestStatusEnum,
      default: RequestStatus.PENDING,
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const Request = mongoose.model("Request", requestSchema);

export default Request;
