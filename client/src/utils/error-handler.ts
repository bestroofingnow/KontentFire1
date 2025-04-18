import { toast } from "@/hooks/use-toast";

/**
 * Error types enum for categorizing different kinds of errors
 */
export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  NOT_FOUND = 'not_found',
  SERVER = 'server',
  UNKNOWN = 'unknown',
}

/**
 * Structure for standardized API errors
 */
export interface ApiError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: Record<string, any>;
  originalError?: any;
}

/**
 * Global error handler utility for consistent error handling across the application
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorListeners: ((error: ApiError) => void)[] = [];
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Parse and standardize errors from various sources
   */
  public parseError(error: any): ApiError {
    // Handle Axios errors
    if (error.isAxiosError) {
      const status = error.response?.status || 0;
      
      if (status === 401) {
        return {
          type: ErrorType.AUTHENTICATION,
          message: 'Your session has expired. Please log in again.',
          originalError: error,
        };
      }
      
      if (status === 403) {
        return {
          type: ErrorType.AUTHORIZATION,
          message: 'You do not have permission to perform this action.',
          originalError: error,
        };
      }
      
      if (status === 404) {
        return {
          type: ErrorType.NOT_FOUND,
          message: 'The requested resource was not found.',
          originalError: error,
        };
      }
      
      if (status >= 500) {
        return {
          type: ErrorType.SERVER,
          message: 'An unexpected server error occurred. Please try again later.',
          originalError: error,
        };
      }
      
      if (!navigator.onLine) {
        return {
          type: ErrorType.NETWORK,
          message: 'No internet connection. Please check your network and try again.',
          originalError: error,
        };
      }
      
      return {
        type: ErrorType.UNKNOWN,
        message: error.response?.data?.message || 'An unexpected error occurred.',
        details: error.response?.data,
        originalError: error,
      };
    }
    
    // Handle API errors that are already in our format
    if (error.type && Object.values(ErrorType).includes(error.type)) {
      return error as ApiError;
    }
    
    // Handle network errors
    if (error.name === 'NetworkError' || !navigator.onLine) {
      return {
        type: ErrorType.NETWORK,
        message: 'No internet connection. Please check your network and try again.',
        originalError: error,
      };
    }
    
    // Default to unknown error
    return {
      type: ErrorType.UNKNOWN,
      message: error.message || 'An unexpected error occurred.',
      originalError: error,
    };
  }
  
  /**
   * Handle an error uniformly across the application
   */
  public handleError(error: any): ApiError {
    const parsedError = this.parseError(error);
    
    // Log the error for debugging
    console.error('[ErrorHandler]', parsedError);
    
    // Show a toast notification for user feedback
    toast({
      title: this.getErrorTitle(parsedError.type),
      description: parsedError.message,
      variant: 'destructive',
    });
    
    // Notify all error listeners
    this.notifyErrorListeners(parsedError);
    
    // Special handling for authentication errors
    if (parsedError.type === ErrorType.AUTHENTICATION) {
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
    }
    
    return parsedError;
  }
  
  /**
   * Get an appropriate title based on error type
   */
  private getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK:
        return 'Network Error';
      case ErrorType.AUTHENTICATION:
        return 'Authentication Error';
      case ErrorType.AUTHORIZATION:
        return 'Access Denied';
      case ErrorType.VALIDATION:
        return 'Validation Error';
      case ErrorType.NOT_FOUND:
        return 'Not Found';
      case ErrorType.SERVER:
        return 'Server Error';
      case ErrorType.UNKNOWN:
      default:
        return 'Error';
    }
  }
  
  /**
   * Add an error listener to be notified when errors occur
   */
  public addErrorListener(listener: (error: ApiError) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return a function to remove the listener
    return () => {
      this.errorListeners = this.errorListeners.filter((l) => l !== listener);
    };
  }
  
  /**
   * Notify all registered error listeners
   */
  private notifyErrorListeners(error: ApiError): void {
    this.errorListeners.forEach((listener) => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
}

// Export a singleton instance
export const errorHandler = ErrorHandler.getInstance();

/**
 * Utility function for easy error handling in async functions
 * 
 * @example
 * const fetchData = async () => {
 *   const result = await safeAsync(async () => {
 *     const response = await fetch('/api/data');
 *     return response.json();
 *   });
 *   
 *   if (result.error) {
 *     // Handle error case
 *     return;
 *   }
 *   
 *   // Use result.data
 * };
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  errorHandler = ErrorHandler.getInstance()
): Promise<{ data?: T; error?: ApiError }> {
  try {
    const data = await asyncFn();
    return { data };
  } catch (error) {
    const parsedError = errorHandler.handleError(error);
    return { error: parsedError };
  }
}