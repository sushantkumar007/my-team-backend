import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { generateAccessRefreshToken } from "../utils/generateAccessRefreshToken.js";

export const isAuthenticated = async (req, res, next) => {
  const { accessToken, refreshToken } = req.cookies;
  const errors = [];

  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(401, "session expired");
      }

      req.user = user;
      return next();
    } catch (error) {
      errors.push(`Access token: ${error.message}`);
    }
  }

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
      const user = await User.findById(decoded._id);

      if (!user || user.refreshToken !== refreshToken) {
        throw new ApiError(401, "session expired");
      }

      const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
        generateAccessRefreshToken({
          _id: user._id,
          email: user.email,
          role: user.role,
        });

      user.refreshToken = newRefreshToken;
      await user.save();

      const cookieOptions = {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      };

      res.cookie("accessToken", newAccessToken, cookieOptions);
      res.cookie("refreshToken", newRefreshToken, cookieOptions);
      req.user = user;
      return next();
    } catch (error) {
      errors.push(`Refresh token: ${error.message}`);
    }

    if (process.env.NODE_ENV === "development") {
      throw new ApiError(401, "Authentication failed", errors);
    }
  }

  res.status(401).json(new ApiError(401, "Unauthorized: Please log in again"));
};
