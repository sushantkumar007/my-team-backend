import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import {
  createGroup,
  getMyGroup,
  getGroupById,
  getGroups,
  deleteGroup,
  invite,
  getInvites,
  getRequests,
  approveJoinRequest,
  rejectJoinRequest,
  removeMember,
  leftGroup,
  updateNotice,
  getGroupHistory,
} from "../controllers/group.controller.js";

const groupRouter = Router();

groupRouter.route("/create-group").post(isAuthenticated, createGroup);
groupRouter.route("/my-group/:groupId").get(isAuthenticated, getMyGroup);
groupRouter.route("/group/:groupId").get(isAuthenticated, getGroupById);
groupRouter.route("/get-groups").get(isAuthenticated, getGroups);
groupRouter.route("/delete-group/:groupId").get(isAuthenticated, deleteGroup);
groupRouter.route("/invite-user/:groupId").post(isAuthenticated, invite);
groupRouter.route("/get-invites/:groupId").get(isAuthenticated, getInvites);
groupRouter.route("/get-requests/:groupId").get(isAuthenticated, getRequests);
groupRouter.route("/approve-request/:requestId").get(isAuthenticated, approveJoinRequest);
groupRouter.route("/reject-request/:requestId").get(isAuthenticated, rejectJoinRequest);
groupRouter.route("/remove-member/:groupId").post(isAuthenticated, removeMember);
groupRouter.route("/left-group/:groupId").get(isAuthenticated, leftGroup);
groupRouter.route("/update-notice/:groupId").post(isAuthenticated, updateNotice);
groupRouter.route("/group-history/:groupId").get(isAuthenticated, getGroupHistory);

export default groupRouter;
