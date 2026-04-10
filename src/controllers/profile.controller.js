import fs from "fs";
import csv from "csv-parser";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Profile from "../models/profile.model.js";
import Group from "../models/group.model.js";
import Request from "../models/request.model.js";
import History from "../models/history.model.js";
import { RequestType, RequestStatus, HistoryActions } from "../utils/constant.js";

export const createProfilesFromCsv = asyncHandler(async (req, res) => {
  const file = req.file;

  if (!file) {
    throw new ApiError(400, "CSV file is required");
  }

  const studentData = [];

  fs.createReadStream(file.path)
    .pipe(csv())
    .on("data", (data) => {
      if (typeof data.courses === "string") {
        data.courses = JSON.parse(data.courses || "[]");
      }
      studentData.push(data);
    })
    .on("end", async () => {
      fs.unlinkSync(file.path);

      if (studentData.length === 0) {
        throw new ApiError(400, "No date found in the csv file");
      }

      const profiles = [];

      for (const userData of studentData) {
        let profile = await Profile.findOne({ email: userData.email });

        if (profile) {
          profile.courses = userData.courses;
          await profile.save();
        } else {
          profile = await Profile.create({ email: userData.email, courses: userData.courses });
        }

        profiles.push(profile);
      }

      res
        .status(201)
        .json(new ApiResponse(201, true, "Profile created successfully", { profiles }));
    })
    .on("error", (error) => {
      throw new ApiError(500, `Error processing csv file :: error :: ${error.message}`);
    });
});

export const getProfile = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found for the user");
  }

  res.status(200).json(new ApiResponse(200, true, "Profile retrieved successfully", { profile }));
});

export const getProfileById = asyncHandler(async (req, res) => {
  const { profileId } = req.params;

  const profile = await Profile.findById(profileId).populate("user", "name username");

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  res.status(200).json(new ApiResponse(200, true, "Profile retrieved successfully", { profile }));
});

export const getProfiles = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const profiles = await Profile.aggregate([
    {
      $match: {
        group: { $exists: false },
        user: { $ne: new mongoose.Types.ObjectId(userId) },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $match: {
        "user.isEmailVerified": true,
      },
    },
    {
      $project: {
        "user.email": 0,
        "user.password": 0,
        "user.role": 0,
        "user.refreshToken": 0,
        "user.isEmailVerified": 0,
        "user.emailVerificationToken": 0,
        "user.emailVerificationDate": 0,
        "user.resetPasswordToken": 0,
        "user.resetPasswordDate": 0,
        "user.createdAt": 0,
        "user.updatedAt": 0,
        "user.__v": 0,
      },
    },
  ]);

  if (profiles.length === 0) {
    throw new ApiError(404, "No profiles found");
  }

  res.status(200).json(new ApiResponse(200, true, "Profiles retrieved successfully", { profiles }));
});

export const updateAbout = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { about } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found for the user");
  }

  profile.about = about;
  await profile.save();

  res.status(200).json(new ApiResponse(200, true, "Profile updated successfully", { profile }));
});

export const updateSkills = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { skills } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found for the user");
  }

  profile.skills = skills;
  await profile.save();

  res.status(200).json(new ApiResponse(200, true, "Profile updated successfully", { profile }));
});

export const updateProjects = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { projects } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.projects = projects;
  await profile.save();

  res.status(200).json(new ApiResponse(200, true, "Profile updated successfully", { profile }));
});

export const updateSocialMedia = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { github, peerlist, linkedin, hashnode, twitter } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.socialMedia = {
    github,
    peerlist,
    linkedin,
    hashnode,
    twitter,
  };
  await profile.save();

  res.status(200).json(new ApiResponse(200, true, "Profile updated successfully", { profile }));
});

export const joinRequest = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { message } = req.body;
  const { groupId } = req.params;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const request = await Request.create({
    user: userId,
    group: groupId,
    requestType: RequestType.JOIN_REQUEST,
    message,
  });

  if (!request) {
    throw new ApiError(500, "Internal server error. Failed to register a request");
  }

  res.status(200).json(new ApiResponse(200, true, "Request registered successfully"));
});

export const getRequests = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const request = await Request.find({
    user: userId,
    requestType: RequestType.JOIN_REQUEST,
  })
    .populate("group", "name")
    .populate("user", "name username");

  if (!request) {
    throw new ApiError(404, "No request found");
  }

  res.status(200).json(new ApiResponse(200, true, "Request found successfully", { request }));
});

export const getInvites = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const invites = await Request.findOne({ user: userId, requestType: RequestType.INVITE_REQUEST })
    .populate("group", "name")
    .populate("user", "name username");

  if (!invites) {
    throw new ApiError(404, "No invites found");
  }

  res.status(200).json(new ApiResponse(200, true, "Invites found successfully", { invites }));
});

export const approveInvite = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { inviteId } = req.params;

  const invite = await Request.findById(inviteId).populate("user", "name");

  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  if (userId.toString() !== invite.user._id.toString()) {
    throw new ApiError(400, "you are not allowed to perform this action");
  }

  if (invite.status !== RequestStatus.PENDING) {
    throw new ApiError(400, `Request is already ${invite.status.toLowerCase()}`);
  }

  const group = await Group.findById(invite.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const profile = await Profile.findOne({ user: invite.user });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  group.members.push({
    user: invite.user._id,
  });
  await group.save();

  profile.group = group._id;
  await profile.save();

  invite.status = RequestStatus.ACCEPTED;
  await invite.save();

  const history = await History.create({
    user: invite.user._id,
    group: group._id,
    action: HistoryActions.MEMBER_ADDED,
    message: `${invite.user.name} join the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to register history");
  }

  res.status(200).json(new ApiResponse(200, true, "Invite approved successfully"));
});

export const rejectInvite = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { inviteId } = req.params;

  const invite = await Request.findById(inviteId);

  if (!invite) {
    throw new ApiError(404, "Invite not found");
  }

  if (userId.toString() !== invite.user.toString()) {
    throw new ApiError(400, "you are not allowed to perform this action");
  }

  if (invite.status !== RequestStatus.PENDING) {
    throw new ApiError(400, `Request is already ${invite.status.toLowerCase()}`);
  }

  invite.status = RequestStatus.REJECTED;
  await invite.save();

  res.status(200).json(new ApiResponse(200, true, "Invite rejected successfully"));
});

export const getUserHistory = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const history = await History.findOne({ user: userId });

  if (!history) {
    throw new ApiError(404, "No history found");
  }

  res.status(200).json(new ApiResponse(200, true, "History found successfully", { history }));
});
