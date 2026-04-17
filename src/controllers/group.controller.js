import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Group from "../models/group.model.js";
import Profile from "../models/profile.model.js";
import History from "../models/history.model.js";
import Request from "../models/request.model.js";
import { HistoryActions, RequestStatus, RequestType, UserRole } from "../utils/constant.js";

export const createGroup = asyncHandler(async (req, res) => {
  const { _id: userId, name } = req.user;
  const { groupName } = req.body;

  const existingGroup = await Group.findOne({ name: groupName });

  if (existingGroup) {
    throw new ApiError(400, "Group name already exists");
  }

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const group = await Group.create({
    name: groupName,
    members: [
      {
        profile: profile._id,
        role: UserRole.GROUP_ADMIN,
      },
    ],
    createdBy: profile._id,
  });

  profile.group = group._id;
  await profile.save();

  const history = await History.create({
    group: group._id,
    profile: profile._id,
    action: HistoryActions.GROUP_CREATED,
    message: `${name} created the group ${groupName}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for group creation");
  }

  res.status(201).json(new ApiResponse(201, true, "Group created successfully", { group }));
});

export const getMyGroup = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group).populate("members.profile", "username");

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some((member) => {
    return member.profile._id.toString() === profile._id.toString();
  });

  if (!isMember) {
    throw new ApiError(403, "You are not a member of this group");
  }

  res
    .status(200)
    .json(new ApiResponse(200, true, "Group details retrieved successfully", { group }));
});

export const getGroupById = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const group = await Group.findById(groupId)
    .select("-notice")
    .populate("members.profile", "username");

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, true, "Group details retrieved successfully", { group }));
});

export const getGroups = asyncHandler(async (req, res) => {
  const groups = await Group.find({ $expr: { $lt: [{ $size: "$members" }, 4] } })
    .select("-notice")
    .populate("members.profile", "username");

  if (!groups) {
    throw new ApiError(404, "No groups found");
  }

  res.status(200).json(new ApiResponse(200, true, "Groups retrieved successfully", { groups }));
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { _id: userId, name } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return (
      member.profile.toString() === profile._id.toString() && member.role === UserRole.GROUP_ADMIN
    );
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can delete the group");
  }

  if (group.members.length > 1) {
    throw new ApiError(400, "Cannot delete group with more than 1 member");
  }

  await Group.deleteOne({ _id: group._id });

  profile.group = undefined;
  await profile.save();

  const history = await History.create({
    profile: profile._id,
    action: HistoryActions.GROUP_DELETED,
    message: `${name} deleted the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for group deletion");
  }

  res.status(200).json(new ApiResponse(200, true, "Group deleted successfully"));
});

export const invite = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { profileId } = req.params;
  const { message } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(404, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  if (group.members.length >= 4) {
    throw new ApiError(400, "Group is full. Cannot invite more members");
  }

  const newMemberProfile = await Profile.findById(profileId);

  if (!newMemberProfile) {
    throw new ApiError(404, "User not found");
  }

  const invite = await Request.create({
    group: group._id,
    profile: newMemberProfile._id,
    message,
    requestType: RequestType.INVITE_REQUEST,
  });

  if (!invite) {
    throw new ApiError(500, "Failed to create invite request");
  }

  res.status(200).json(new ApiResponse(200, true, "Invite sent successfully", { invite }));
});

export const getInvites = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const invites = await Request.find({
    group: profile.group,
    requestType: RequestType.INVITE_REQUEST,
  }).populate("profile", "username");

  if (!invites) {
    throw new ApiError(404, "No invites found");
  }

  res.status(200).json(new ApiResponse(200, true, "Invites retrieved successfully", { invites }));
});

export const getRequests = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const requests = await Request.find({ group: group._id, requestType: RequestType.JOIN_REQUEST })
    .populate("group", "name")
    .populate("profile", "username");

  if (!requests) {
    throw new ApiError(404, "No requests found");
  }

  res.status(200).json(new ApiResponse(200, true, "Requests retrieved successfully", { requests }));
});

export const approveJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { _id: userId } = req.user;

  const request = await Request.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Join request not found");
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(400, `Join request has already been ${request.status}`);
  }

  const group = await Group.findById(request.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return (
      member.profile.toString() === profile._id.toString() && member.role === UserRole.GROUP_ADMIN
    );
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can approve join requests");
  }

  if (group.members.length >= 4) {
    throw new ApiError(400, "Group is full. Cannot approve join request");
  }

  const newMemberProfile = await Profile.findById(request.profile).populate("user", "name");

  if (!newMemberProfile) {
    throw new ApiError(404, "New member's Profile not found");
  }

  group.members.push({ profile: newMemberProfile._id });
  await group.save();

  newMemberProfile.group = group._id;
  await newMemberProfile.save();

  request.status = RequestStatus.ACCEPTED;
  await request.save();

  const history = await History.create({
    group: group._id,
    profile: newMemberProfile._id,
    action: HistoryActions.MEMBER_ADDED,
    message: `${newMemberProfile.name} join the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for member addition");
  }

  res.status(200).json(new ApiResponse(200, true, "Request approved successfully"));
});

export const rejectJoinRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { _id: userId } = req.user;

  const request = await Request.findById(requestId);

  if (!request) {
    throw new ApiError(404, "Join request not found");
  }

  if (request.status !== RequestStatus.PENDING) {
    throw new ApiError(400, `Join request has already been ${request.status}`);
  }

  const group = await Group.findById(request.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const profile = await Profile.findOne({ user: userId });

  const isGroupAdmin = group.members.some((member) => {
    return (
      member.profile.toString() === profile._id.toString() && member.role === UserRole.GROUP_ADMIN
    );
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can reject join requests");
  }

  request.status = RequestStatus.REJECTED;
  await request.save();

  res.status(200).json(new ApiResponse(200, true, "Request rejected successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
  const { profileId } = req.params;
  const { _id: userId } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return (
      member.profile.toString() === profile._id.toString() && member.role === UserRole.GROUP_ADMIN
    );
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can remove members");
  }

  const memberProfile = await Profile.findById(profileId).populate("user", "name");

  if (!memberProfile) {
    throw new ApiError(404, "Member's profile not found");
  }

  const isMember = group.members.some((member) => {
    return member.profile.toString() === memberProfile._id.toString();
  });

  if (!isMember) {
    throw new ApiError(404, "User is not a member of this group");
  }

  group.members.forEach((member) => {
    if (
      member.profile.toString() === memberProfile._id.toString() &&
      member.role === UserRole.GROUP_ADMIN
    ) {
      throw new ApiError(400, "Cannot remove group admin");
    }
  });

  group.members = group.members.filter((member) => {
    return member.profile.toString() !== memberProfile._id.toString();
  });
  await group.save();

  memberProfile.group = undefined;
  await memberProfile.save();

  const history = await History.create({
    group: group._id,
    profile: memberProfile._id,
    action: HistoryActions.MEMBER_REMOVED,
    message: `${memberProfile.user.name} has been removed from the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for member removal");
  }

  res.status(200).json(new ApiResponse(200, true, "Member removed successfully"));
});

export const leftGroup = asyncHandler(async (req, res) => {
  const { _id: userId, name } = req.user;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some((member) => {
    return member.profile.toString() === profile._id.toString();
  });

  if (!isMember) {
    throw new ApiError(404, "You are not a member of this group");
  }

  group.members.forEach((member) => {
    if (
      member.profile.toString() === profile._id.toString() &&
      member.role === UserRole.GROUP_ADMIN
    ) {
      throw new ApiError(400, "Group admin cannot leave the group");
    }
  });

  group.members = group.members.filter((member) => {
    return member.profile.toString() !== profile._id.toString();
  });
  await group.save();

  profile.group = undefined;
  await profile.save();

  const history = await History.create({
    group: group._id,
    profile: profile._id,
    action: HistoryActions.MEMBER_LEFT,
    message: `${name} left the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for member leaving");
  }

  res.status(200).json(new ApiResponse(200, true, "Left group successfully"));
});

export const updateNotice = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const { notice } = req.body;

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  if (!profile.group) {
    throw new ApiError(400, "You are not a part of any group");
  }

  const group = await Group.findById(profile.group);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return (
      member.profile.toString() === profile._id.toString() && member.role === UserRole.GROUP_ADMIN
    );
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can update notice");
  }

  group.notice = notice;
  await group.save();

  res.status(200).json(new ApiResponse(200, true, "Notice updated successfully"));
});

export const getGroupHistory = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const history = await History.find({ group: groupId });

  if (!history) {
    throw new ApiError(404, "No history found for this group");
  }

  res.status(200).json(new ApiResponse(200, true, "Group history retrieved successfully", history));
});
