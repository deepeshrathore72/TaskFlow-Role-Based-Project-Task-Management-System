const express = require('express');
const router = express.Router();
const {
  getAllTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByProject,
} = require('../controllers');
const {
  authenticate,
  authorize,
  createTaskValidator,
  updateTaskValidator,
  updateTaskStatusValidator,
  uuidParamValidator,
  paginationValidator,
  validate,
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Get my tasks (for all users)
router.get('/my-tasks', paginationValidator, validate, getMyTasks);

// Get all tasks (filtered by role)
router.get('/', paginationValidator, validate, getAllTasks);

// Get tasks by project
router.get('/project/:projectId', uuidParamValidator('projectId'), validate, getTasksByProject);

// Create task - managers and admins only
router.post('/', authorize('admin', 'manager'), createTaskValidator, validate, createTask);

// Get single task
router.get('/:id', uuidParamValidator('id'), validate, getTask);

// Update task - managers and admins only
router.put(
  '/:id',
  authorize('admin', 'manager'),
  uuidParamValidator('id'),
  updateTaskValidator,
  validate,
  updateTask
);

// Update task status - any authenticated user (if assigned)
router.patch(
  '/:id/status',
  uuidParamValidator('id'),
  updateTaskStatusValidator,
  validate,
  updateTaskStatus
);

// Delete task - managers and admins only
router.delete('/:id', authorize('admin', 'manager'), uuidParamValidator('id'), validate, deleteTask);

module.exports = router;
