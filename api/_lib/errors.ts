export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL';

export interface StandardErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: unknown;

  constructor(code: ErrorCode, statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function validationError(message: string, details?: unknown): ApiError {
  return new ApiError('VALIDATION_ERROR', 400, message, details);
}

export function unauthorizedError(message = 'Unauthorized: Trip token missing or invalid'): ApiError {
  return new ApiError('UNAUTHORIZED', 401, message);
}

export function notFoundError(message = 'Resource not found'): ApiError {
  return new ApiError('NOT_FOUND', 404, message);
}

export function conflictError(message = 'Resource conflict'): ApiError {
  return new ApiError('CONFLICT', 409, message);
}

export function internalError(message = 'Internal server error'): ApiError {
  return new ApiError('INTERNAL', 500, message);
}
