import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessRefreshToken } from "../utils/generateAccessRefreshToken.js";
import User from "../models/user.model.js";
import Profile from "../models/profile.model.js";
import {
  sendMail,
  emailVerificationMailBody,
  resetPasswordRequestMailBody,
} from "../utils/email.js";
import bcrypt from "bcryptjs";
import Crypto from "crypto";

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, "User already exists, Please login insted");
  }

  const profile = await Profile.findOne({ email });

  if (!profile) {
    throw new ApiError(400, "you are not a part of any course. please join a course first");
  }

  const user = await User.create({ name, email, password });

  if (!user) {
    throw new ApiError(500, "Internal server error. Failed to register a user.");
  }

  profile.user = user._id;
  await profile.save();

  const emailVerificationToken = Crypto.randomBytes(32).toString("hex");
  const emailVerificationExpiry = Date.now() + 10 * 60 * 1000;
  const emailVerificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;
  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpiry = emailVerificationExpiry;
  await user.save();

  const { text, html } = emailVerificationMailBody({ name, emailVerificationUrl });

  sendMail({ email, subject: "Please verify your email", text, html });

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        true,
        "User registered successfully. Please check your email to verify your account.",
        { user: userData },
      ),
    );
});

export const verify = asyncHandler(async (req, res) => {
  const { emailVerificationToken } = req.params;

  const user = await User.findOne({ emailVerificationToken });

  if (!user) {
    throw new ApiError(400, "Invalid email verification token");
  }

  if (user.emailVerificationExpiry < Date.now()) {
    throw new ApiError(410, "Verification link has expired");
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();

  res.status(200).json(new ApiResponse(200, true, "Email verified successfully"));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }

  if (user.isEmailVerified !== true) {
    throw new ApiError(401, "Please verify your email to login");
  }

  const isPasswordMatched = await bcrypt.compare(password, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid credentials");
  }

  const { accessToken, refreshToken } = generateAccessRefreshToken({
    _id: user._id,
    email: user.email,
    role: user.role,
  });

  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
  };

  res.cookie("accessToken", accessToken, cookieOptions);
  res.cookie("refreshToken", refreshToken, cookieOptions);
  res.status(200).json(new ApiResponse(200, true, "Login successful"));
});

export const logout = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const user = await User.findById(userId);

  user.refreshToken = undefined;
  await user.save();

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.status(200).json(new ApiResponse(200, true, "Logout successful"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    role: user.role,
  };

  res
    .status(200)
    .json(new ApiResponse(200, true, "User retrieved successfully", { user: userData }));
});

export const resendEmailVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Invalid email");
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "Email is already verified");
  }

  const emailVerificationToken = Crypto.randomBytes(32).toString("hex");
  const emailVerificationExpiry = Date.now() + 10 * 60 * 1000;
  const emailVerificationUrl = `${process.env.CLIENT_URL}/verify-email/${emailVerificationToken}`;

  user.emailVerificationToken = emailVerificationToken;
  user.emailVerificationExpiry = emailVerificationExpiry;
  await user.save();

  const { text, html } = emailVerificationMailBody({ name: user.name, emailVerificationUrl });

  sendMail({ email, subject: "Please verify your email", text, html });

  res.status(200).json(new ApiResponse(200, true, "Email verification request sent successfully"));
});

export const updatePassword = asyncHandler(async (req, res) => {
  const user = req.user;
  const { currentPassword, newPassword } = req.body;

  const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordMatched) {
    throw new ApiError(401, "Invalid credentials");
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json(new ApiResponse(200, true, "Password updated successfully"));
});

export const resetPasswordRequest = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Invalid email");
  }

  const resetPasswordToken = Crypto.randomBytes(32).toString("hex");
  const resetPasswordExpiry = Date.now() + 10 * 60 * 1000;
  const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password/${resetPasswordToken}`;

  user.resetPasswordToken = resetPasswordToken;
  user.resetPasswordExpiry = resetPasswordExpiry;
  await user.save();

  const { text, html } = resetPasswordRequestMailBody({ name: user.name, resetPasswordUrl });

  sendMail({ email, subject: "Please reset your password", text, html });

  res.status(200).json(new ApiResponse(200, true, "Password reset request sent successfully"));
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetPasswordToken } = req.params;
  const { password } = req.body;

  const user = await User.findOne({ resetPasswordToken });

  if (!user) {
    throw new ApiError(400, "Invalid password reset token");
  }

  if (user.resetPasswordExpiry < Date.now()) {
    throw new ApiError(410, "Reset link has expired");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.status(200).json(new ApiResponse(200, true, "Password reset successfully"));
});
