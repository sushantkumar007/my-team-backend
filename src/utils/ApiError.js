class ApiError extends Error {
  constructor(statusCode, message = "Internal Server Error", errors = [], stack = "") {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    this.errors = errors;

    if (process.env.NODE_ENV !== "production") {
      if (stack) {
        this.stack = stack;
      } else {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      success: this.success,
      message: this.message,
      errors: this.errors,
    };
  }
}

export { ApiError };
