/**
 * Enhanced error handling utility
 */

// Custom error types
export class NetworkError extends Error {
  status?: number;
  
  constructor(message: string, status?: number) {
    super(message);
    this.name = "NetworkError";
    this.status = status;
  }
}

export class ValidationError extends Error {
  errors?: Record<string, string[]>;
  
  constructor(message: string, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ValidationError";
    this.errors = errors;
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = "You must be logged in to perform this action") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class PermissionError extends Error {
  constructor(message: string = "You don't have permission to perform this action") {
    super(message);
    this.name = "PermissionError";
  }
}

/**
 * Parses an error response from the API
 */
export const parseApiError = async (response: Response): Promise<Error> => {
  try {
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      
      // Handle validation errors
      if (response.status === 400 && errorData.errors) {
        return new ValidationError(errorData.message || "Validation error", errorData.errors);
      }
      
      // Handle authentication errors
      if (response.status === 401) {
        return new AuthenticationError(errorData.message || "Authentication required");
      }
      
      // Handle permission errors
      if (response.status === 403) {
        return new PermissionError(errorData.message || "Permission denied");
      }
      
      // Generic error with message from server
      return new NetworkError(
        errorData.message || `Request failed with status ${response.status}`, 
        response.status
      );
    }
    
    // Default case for non-JSON responses
    return new NetworkError(`Request failed with status ${response.status}`, response.status);
  } catch (err) {
    return new NetworkError(`Failed to parse error response: ${err}`, response.status);
  }
};

/**
 * Handles errors in a consistent way with specific error handling by type
 */
export const handleError = (error: unknown, callbacks?: {
  onNetworkError?: (error: NetworkError) => void,
  onValidationError?: (error: ValidationError) => void,
  onAuthError?: (error: AuthenticationError) => void,
  onPermissionError?: (error: PermissionError) => void,
  onUnexpectedError?: (error: Error) => void
}): string => {
  // Default error message
  let errorMessage = "An unexpected error occurred";
  
  if (error instanceof NetworkError) {
    errorMessage = error.message;
    callbacks?.onNetworkError?.(error);
  } else if (error instanceof ValidationError) {
    errorMessage = error.message;
    callbacks?.onValidationError?.(error);
  } else if (error instanceof AuthenticationError) {
    errorMessage = error.message;
    callbacks?.onAuthError?.(error);
  } else if (error instanceof PermissionError) {
    errorMessage = error.message;
    callbacks?.onPermissionError?.(error);
  } else if (error instanceof Error) {
    errorMessage = error.message;
    callbacks?.onUnexpectedError?.(error);
  }
  
  // Log the error for debugging in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error details:', error);
  }
  
  return errorMessage;
};