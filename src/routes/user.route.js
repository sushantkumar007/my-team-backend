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
import { validate } from "../middlewares/validator.middleware.js";
import { registerValidation, loginValidation } from "../validators/user.validator.js";

const userRouter = Router();

userRouter.route("/register").post(registerValidation(), validate, register);
userRouter.route("/verify/:emailVerificationToken").get(verify);
userRouter.route("/login").post(loginValidation(), validate, login);
userRouter.route("/logout").get(isAuthenticated, logout);
userRouter.route("/me").get(isAuthenticated, getCurrentUser);
userRouter.route("/resend-email-verification").post(resendEmailVerification);
userRouter.route("/update-password").patch(isAuthenticated, updatePassword);
userRouter.route("/reset-password-request").post(resetPasswordRequest);
userRouter.route("/reset-password/:resetPasswordToken").patch(resetPassword);

export default userRouter;
