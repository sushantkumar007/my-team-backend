import { body } from "express-validator";

const registerValidation = () => {
  return [
    body("name").trim().notEmpty().withMessage("fullname is required"),
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 6 })
      .withMessage("min 6 char are required")
      .isLength({ max: 16 })
      .withMessage("max 16 char are allowed"),
  ];
};

const loginValidation = () => {
  return [
    body("email")
      .trim()
      .notEmpty()
      .withMessage("email is required")
      .isEmail()
      .withMessage("Invalid email"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("password is required")
      .isLength({ min: 6 })
      .withMessage("min 6 char are required")
      .isLength({ max: 16 })
      .withMessage("max 16 char are allowed"),
  ];
};

export { registerValidation, loginValidation };
