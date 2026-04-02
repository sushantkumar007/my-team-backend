const errorHandler = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  const payload = {
    statusCode,
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  };

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};

export { errorHandler };
