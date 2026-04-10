import { Router } from "express";
import {
  register,
  verify,
  login,
  logout,
  getCurrentUser,
  resendEmailVerification,
  updatePassword,
  resetPasswordRequest,
  resetPassword,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(register);
userRouter.route("/verify/:emailVerificationToken").get(verify);
userRouter.route("/login").post(login);
userRouter.route("/logout").get(isAuthenticated, logout);
userRouter.route("/me").get(isAuthenticated, getCurrentUser);
userRouter.route("/resend-email-verification").post(resendEmailVerification);
userRouter.route("/update-password").post(isAuthenticated, updatePassword);
userRouter.route("/reset-password-request").post(resetPasswordRequest);
userRouter.route("/reset-password/:resetPasswordToken").post(resetPassword);

export default userRouter;
