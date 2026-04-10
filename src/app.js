import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorHandler } from "./middlewares/error.middleware.js";

dotenv.config();

// import routes
import userRouter from "./routes/user.route.js";
import profileRouter from "./routes/profile.route.js";
import groupRouter from "./routes/group.route.js";
import healthcheckRouter from "./routes/healthcheck.route.js";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  }),
);

// routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/profiles", profileRouter);
app.use("/api/v1/groups", groupRouter);
app.use("/healthcheck", healthcheckRouter);

// Error handler
app.use(errorHandler);

export default app;
