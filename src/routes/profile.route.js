import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

import {
  createProfilesFromCsv,
  getProfileById,
  getProfile,
  getProfiles,
  updateAbout,
  updateSkills,
  updateProjects,
  updateSocialMedia,
  joinRequest,
  getRequests,
  getInvites,
  approveInvite,
  rejectInvite,
  getUserHistory,
} from "../controllers/profile.controller.js";

const profileRouter = Router();

profileRouter
  .route("/upload-csv")
  .post(isAuthenticated, upload.single("file"), createProfilesFromCsv);
profileRouter.route("/my-profile").get(isAuthenticated, getProfile);
profileRouter.route("/profile/:profileId").get(isAuthenticated, getProfileById);
profileRouter.route("/profiles").get(isAuthenticated, getProfiles);
profileRouter.route("/update-about").post(isAuthenticated, updateAbout);
profileRouter.route("/update-skills").post(isAuthenticated, updateSkills);
profileRouter.route("/update-projects").post(isAuthenticated, updateProjects);
profileRouter.route("/update-social-media").post(isAuthenticated, updateSocialMedia);
profileRouter.route("/join-request/:groupId").post(isAuthenticated, joinRequest);
profileRouter.route("/get-requests").get(isAuthenticated, getRequests);
profileRouter.route("/get-invites").get(isAuthenticated, getInvites);
profileRouter.route("/approve-invite/:inviteId").get(isAuthenticated, approveInvite);
profileRouter.route("/reject-invite/:inviteId").get(isAuthenticated, rejectInvite);
profileRouter.route("/get-user-history").get(isAuthenticated, getUserHistory);

export default profileRouter;
