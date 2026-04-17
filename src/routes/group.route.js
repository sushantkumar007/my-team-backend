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
groupRouter.route("/my-group").get(isAuthenticated, getMyGroup);
groupRouter.route("/get-group/:groupId").get(isAuthenticated, getGroupById);
groupRouter.route("/get-groups").get(isAuthenticated, getGroups);
groupRouter.route("/delete-group").delete(isAuthenticated, deleteGroup);
groupRouter.route("/invite-user/:profileId").post(isAuthenticated, invite);
groupRouter.route("/get-invites").get(isAuthenticated, getInvites);
groupRouter.route("/get-requests").get(isAuthenticated, getRequests);
groupRouter.route("/approve-request/:requestId").patch(isAuthenticated, approveJoinRequest);
groupRouter.route("/reject-request/:requestId").patch(isAuthenticated, rejectJoinRequest);
groupRouter.route("/remove-member/:profileId").delete(isAuthenticated, removeMember);
groupRouter.route("/left-group").patch(isAuthenticated, leftGroup);
groupRouter.route("/update-notice").patch(isAuthenticated, updateNotice);
groupRouter.route("/get-group-history/:groupId").get(isAuthenticated, getGroupHistory);

export default groupRouter;
