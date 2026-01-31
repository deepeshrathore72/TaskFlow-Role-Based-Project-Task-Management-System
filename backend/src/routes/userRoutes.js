const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getAssignableUsers,
} = require('../controllers');
const {
  authenticate,
  authorize,
  registerValidator,
  updateUserValidator,
  uuidParamValidator,
  paginationValidator,
  validate,
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Get assignable users (managers and users) - for managers to assign to projects
router.get('/assignable', authorize('admin', 'manager'), getAssignableUsers);

// Get users by role
router.get('/role/:role', getUsersByRole);

// Admin only routes
router.get('/', authorize('admin'), paginationValidator, validate, getAllUsers);
router.post('/', authorize('admin'), registerValidator, validate, createUser);
router.get('/:id', authorize('admin'), uuidParamValidator('id'), validate, getUser);
router.put('/:id', authorize('admin'), uuidParamValidator('id'), updateUserValidator, validate, updateUser);
router.delete('/:id', authorize('admin'), uuidParamValidator('id'), validate, deleteUser);

module.exports = router;
