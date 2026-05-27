export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
  error?: string;
};

// A single response shape keeps future route handlers and the frontend aligned without repeating ad hoc JSON contracts.
export function createSuccessResponse<T>(data: T, message = "Success"): ApiSuccessResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

// Centralized error formatting makes it easier to standardize API failures across auth, orders, and payments later.
export function createErrorResponse(message = "Something went wrong", error?: string): ApiErrorResponse {
  return {
    success: false,
    message,
    ...(error ? { error } : {}),
  };
}