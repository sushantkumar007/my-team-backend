import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

const upload = multer({
  dest: "src/uploads",
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter(req, file, cb) {
    if (file.mimetype === "text/csv") {
      cb(null, true);
    } else {
      cb(new ApiError(400, "Only CSV files are allowed"), false);
    }
  },
});

export default upload;
