import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/multer.middleware.js";

import {
  createProfilesFromCsv,
  getProfileById,
  getMyProfile,
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
  .post(isAuthenticated, isAdmin, upload.single("file"), createProfilesFromCsv);
profileRouter.route("/my-profile").get(isAuthenticated, getMyProfile);
profileRouter.route("/get-profile/:profileId").get(isAuthenticated, getProfileById);
profileRouter.route("/get-profiles").get(isAuthenticated, getProfiles);
profileRouter.route("/update-about").patch(isAuthenticated, updateAbout);
profileRouter.route("/update-skills").patch(isAuthenticated, updateSkills);
profileRouter.route("/update-projects").patch(isAuthenticated, updateProjects);
profileRouter.route("/update-social-media").patch(isAuthenticated, updateSocialMedia);
profileRouter.route("/join-request/:groupId").post(isAuthenticated, joinRequest);
profileRouter.route("/get-requests").get(isAuthenticated, getRequests);
profileRouter.route("/get-invites").get(isAuthenticated, getInvites);
profileRouter.route("/approve-invite/:inviteId").get(isAuthenticated, approveInvite);
profileRouter.route("/reject-invite/:inviteId").get(isAuthenticated, rejectInvite);
profileRouter.route("/get-user-history").get(isAuthenticated, getUserHistory);

export default profileRouter;
