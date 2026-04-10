class ApiResponse {
  constructor(statusCode, success = true, message = "Success", data = {}) {
    this.statusCode = statusCode;
    this.success = success;
    this.message = message;
    this.data = data;
  }

  toJSON() {
    return {
      statusCode: this.statusCode,
      success: this.success,
      message: this.message,
      data: this.data,
    };
  }
}

export { ApiResponse };
