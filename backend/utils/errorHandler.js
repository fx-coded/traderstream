const logger = require('./logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Generate standardized error responses
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let errorMessage = 'Internal Server Error';
  let errorDetails = null;
  
  // Handle our custom API errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorDetails = err.details;
  } 
  // Handle Firebase Auth errors
  else if (err.code && err.code.startsWith('auth/')) {
    statusCode = 401;
    errorMessage = err.message || 'Authentication error';
  }
  // Handle Firebase Firestore errors 
  else if (err.code && err.code.startsWith('firestore/')) {
    statusCode = 400;
    errorMessage = err.message || 'Database operation error';
  }
  // Handle other Firebase errors
  else if (err.code && err.code.startsWith('app/')) {
    statusCode = 500;
    errorMessage = 'Firebase service error';
  }
  // Handle validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    errorMessage = 'Validation Error';
    errorDetails = err.details || err.message;
  }
  
  // Log the error with appropriate level
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${errorMessage}`, err);
  } else {
    logger.warn(`${statusCode} - ${errorMessage}`, err);
  }

  // Return standardized error response
  const errorResponse = {
    error: errorMessage
  };
  
  // Include error details in development or if appropriate
  if (errorDetails && (process.env.NODE_ENV !== 'production' || statusCode < 500)) {
    errorResponse.details = errorDetails;
  }
  
  // Include stack trace in development for 5xx errors
  if (process.env.NODE_ENV !== 'production' && statusCode >= 500) {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async handler to catch and forward errors to the error handler
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ApiError,
  errorHandler,
  asyncHandler
};