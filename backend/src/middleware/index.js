const { authenticate, authorize, generateToken, setTokenCookie, clearTokenCookie } = require('./auth');
const { ApiError, errorHandler, notFound, asyncHandler } = require('./errorHandler');
const validate = require('./validate');
const validators = require('./validators');

module.exports = {
  authenticate,
  authorize,
  generateToken,
  setTokenCookie,
  clearTokenCookie,
  ApiError,
  errorHandler,
  notFound,
  asyncHandler,
  validate,
  ...validators,
};
