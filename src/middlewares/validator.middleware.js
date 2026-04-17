import { validationResult } from "express-validator";
import { ApiError } from "../utils/ApiError.js";

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const extractedArray = [];

  errors.array().forEach((error) => {
    extractedArray.push({
      [error.path]: error.msg,
    });
  });

  throw new ApiError(400, "Invalid data", extractedArray);
};

export { validate };
