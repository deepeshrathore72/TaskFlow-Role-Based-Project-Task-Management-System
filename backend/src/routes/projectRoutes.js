const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
} = require('../controllers');
const {
  authenticate,
  authorize,
  createProjectValidator,
  updateProjectValidator,
  addMemberValidator,
  uuidParamValidator,
  paginationValidator,
  validate,
} = require('../middleware');

// All routes require authentication
router.use(authenticate);

// Get all projects (filtered by role)
router.get('/', paginationValidator, validate, getAllProjects);

// Create project - managers and admins only
router.post('/', authorize('admin', 'manager'), createProjectValidator, validate, createProject);

// Get single project
router.get('/:id', uuidParamValidator('id'), validate, getProject);

// Update project - managers and admins only
router.put(
  '/:id',
  authorize('admin', 'manager'),
  uuidParamValidator('id'),
  updateProjectValidator,
  validate,
  updateProject
);

// Delete project - managers and admins only
router.delete('/:id', authorize('admin', 'manager'), uuidParamValidator('id'), validate, deleteProject);

// Project members routes
router.get('/:id/members', uuidParamValidator('id'), validate, getProjectMembers);
router.post(
  '/:id/members',
  authorize('admin', 'manager'),
  uuidParamValidator('id'),
  addMemberValidator,
  validate,
  addMember
);
router.delete(
  '/:id/members/:userId',
  authorize('admin', 'manager'),
  uuidParamValidator('id'),
  uuidParamValidator('userId'),
  validate,
  removeMember
);

module.exports = router;
