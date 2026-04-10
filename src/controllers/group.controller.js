import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Group from "../models/group.model.js";
import Profile from "../models/profile.model.js";
import History from "../models/history.model.js";
import User from "../models/user.model.js";
import Request from "../models/request.model.js";
import { HistoryActions, RequestStatus, RequestType, UserRole } from "../utils/constant.js";

export const createGroup = asyncHandler(async (req, res) => {
  const { _id: userId, name } = req.user;
  const { groupName } = req.body;

  const existingGroup = await Group.findOne({ name: groupName });

  if (existingGroup) {
    throw new ApiError(400, "Group name already exists");
  }

  const group = await Group.create({
    name: groupName,
    members: [
      {
        user: userId,
        role: UserRole.GROUP_ADMIN,
      },
    ],
    createdBy: userId,
  });

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.group = group._id;
  await profile.save();

  const history = await History.create({
    group: group._id,
    user: userId,
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
  const { groupId } = req.params;

  const group = await Group.findById(groupId).populate("members.user", "name username");

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some((member) => {
    return member.user._id.toString() === userId.toString();
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
    .populate("members.user", "name username");

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
    .populate("members.user", "name username");

  if (!groups) {
    throw new ApiError(404, "No groups found");
  }

  res.status(200).json(new ApiResponse(200, true, "Groups retrieved successfully", { groups }));
});

export const deleteGroup = asyncHandler(async (req, res) => {
  const { _id: userId, name } = req.user;
  const { groupId } = req.params;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN;
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can delete the group");
  }

  if (group.members.length > 1) {
    throw new ApiError(400, "Cannot delete group with more than 1 member");
  }

  const deletedGroup = await Group.deleteOne({ _id: groupId });

  const profile = await Profile.findOne({ user: userId });

  profile.group = undefined;
  await profile.save();

  const history = await History.create({
    user: userId,
    action: HistoryActions.GROUP_DELETED,
    message: `${name} deleted the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for group deletion");
  }

  res.status(200).json(new ApiResponse(200, true, "Group deleted successfully", { deletedGroup }));
});

export const invite = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { userId, message } = req.body;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  if (group.members.length >= 4) {
    throw new ApiError(400, "Group is full. Cannot invite more members");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const invite = await Request.create({
    group: group._id,
    user: user._id,
    message,
    requestType: RequestType.INVITE_REQUEST,
  });

  if (!invite) {
    throw new ApiError(500, "Failed to create invite request");
  }

  res.status(200).json(new ApiResponse(200, true, "Invite sent successfully", { invite }));
});

export const getInvites = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const invites = await Request.find({ group: groupId, requestType: RequestType.INVITE_REQUEST })
    .populate("group", "name")
    .populate("user", "name username");

  if (!invites) {
    throw new ApiError(404, "No invites found");
  }

  res.status(200).json(new ApiResponse(200, true, "Invites retrieved successfully", { invites }));
});

export const getRequests = asyncHandler(async (req, res) => {
  const { groupId } = req.params;

  const requests = await Request.find({ group: groupId, requestType: RequestType.JOIN_REQUEST })
    .populate("group", "name")
    .populate("user", "name username");

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

  const isGroupAdmin = group.members.some((member) => {
    return member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN;
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can approve join requests");
  }

  if (group.members.length >= 4) {
    throw new ApiError(400, "Group is full. Cannot approve join request");
  }

  const user = await User.findById(request.user);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  group.members.push({ user: user._id });
  await group.save();

  const profile = await Profile.findOne({ user: user._id });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.group = group._id;
  await profile.save();

  request.status = RequestStatus.ACCEPTED;
  await request.save();

  const history = await History.create({
    group: group._id,
    user: user._id,
    action: HistoryActions.MEMBER_ADDED,
    message: `${user.name} join the group ${group.name}`,
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

  const isGroupAdmin = group.members.some((member) => {
    return member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN;
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can reject join requests");
  }

  request.status = RequestStatus.REJECTED;
  await request.save();

  res.status(200).json(new ApiResponse(200, true, "Request rejected successfully"));
});

export const removeMember = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: userId } = req.user;
  const { memberUserId } = req.body;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN;
  });

  if (!isGroupAdmin) {
    throw new ApiError(403, "Only group admin can remove members");
  }

  const isMember = group.members.some((member) => {
    return member.user.toString() === memberUserId.toString();
  });

  if (!isMember) {
    throw new ApiError(404, "User is not a member of this group");
  }

  group.members.forEach((member) => {
    if (
      member.user.toString() === memberUserId.toString() &&
      member.role === UserRole.GROUP_ADMIN
    ) {
      throw new ApiError(400, "Cannot remove group admin");
    }
  });

  group.members = group.members.filter((member) => {
    return member.user.toString() !== memberUserId.toString();
  });
  await group.save();

  const profile = await Profile.findOne({ user: memberUserId }).populate("user", "name");

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.group = undefined;
  await profile.save();

  const history = await History.create({
    group: group._id,
    user: memberUserId,
    action: HistoryActions.MEMBER_REMOVED,
    message: `${profile.user.name} has been removed from the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for member removal");
  }

  res.status(200).json(new ApiResponse(200, true, "Member removed successfully"));
});

export const leftGroup = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: userId, name } = req.user;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isMember = group.members.some((member) => {
    return member.user.toString() === userId.toString();
  });

  if (!isMember) {
    throw new ApiError(404, "You are not a member of this group");
  }

  group.members.forEach((member) => {
    if (member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN) {
      throw new ApiError(400, "Group admin cannot leave the group");
    }
  });

  group.members = group.members.filter((member) => {
    return member.user.toString() !== userId.toString();
  });
  await group.save();

  const profile = await Profile.findOne({ user: userId });

  if (!profile) {
    throw new ApiError(404, "Profile not found");
  }

  profile.group = undefined;
  await profile.save();

  const history = await History.create({
    group: group._id,
    user: userId,
    action: HistoryActions.MEMBER_LEFT,
    message: `${name} left the group ${group.name}`,
  });

  if (!history) {
    throw new ApiError(500, "Failed to create history record for member leaving");
  }

  res.status(200).json(new ApiResponse(200, true, "Left group successfully"));
});

export const updateNotice = asyncHandler(async (req, res) => {
  const { groupId } = req.params;
  const { _id: userId } = req.user;
  const { notice } = req.body;

  const group = await Group.findById(groupId);

  if (!group) {
    throw new ApiError(404, "Group not found");
  }

  const isGroupAdmin = group.members.some((member) => {
    return member.user.toString() === userId.toString() && member.role === UserRole.GROUP_ADMIN;
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
