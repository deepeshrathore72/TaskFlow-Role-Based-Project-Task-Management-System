const { Op } = require('sequelize');
const { Project, User, Task, ProjectMember } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get all projects
 * @route   GET /api/projects
 * @access  Private
 */
const getAllProjects = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, priority } = req.query;
  const offset = (page - 1) * limit;
  const { user } = req;

  // Build where clause
  const where = {};

  if (search) {
    where.name = { [Op.iLike]: `%${search}%` };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  let queryOptions = {
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: ['role'] },
      },
    ],
    distinct: true,
  };

  // Filter based on role
  if (user.role === 'manager') {
    // Managers see projects they manage or are members of
    queryOptions.where = {
      ...where,
      [Op.or]: [
        { managerId: user.id },
        { '$members.id$': user.id },
      ],
    };
  } else if (user.role === 'user') {
    // Users only see projects they are members of
    queryOptions.include[1].required = true;
    queryOptions.include[1].where = { id: user.id };
  }

  const { count, rows: projects } = await Project.findAndCountAll(queryOptions);

  // Get task counts for all projects in a single query
  const projectIds = projects.map(p => p.id);
  const taskCounts = await Task.findAll({
    where: { projectId: projectIds },
    attributes: [
      'projectId',
      'status',
      [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
    ],
    group: ['projectId', 'status'],
    raw: true,
  });

  // Organize task counts by project
  const taskCountsByProject = {};
  taskCounts.forEach(tc => {
    if (!taskCountsByProject[tc.projectId]) {
      taskCountsByProject[tc.projectId] = {
        todo: 0,
        'in-progress': 0,
        review: 0,
        done: 0,
      };
    }
    taskCountsByProject[tc.projectId][tc.status] = parseInt(tc.count);
  });

  // Add task counts to projects
  const projectsWithTaskCounts = projects.map(project => {
    const statusCounts = taskCountsByProject[project.id] || {
      todo: 0,
      'in-progress': 0,
      review: 0,
      done: 0,
    };

    return {
      ...project.toJSON(),
      taskCounts: statusCounts,
      totalTasks: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    };
  });

  res.status(200).json({
    success: true,
    data: {
      projects: projectsWithTaskCounts,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    },
  });
});

/**
 * @desc    Get single project
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = asyncHandler(async (req, res) => {
  const { user } = req;

  const project = await Project.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        through: { attributes: ['role', 'joinedAt'] },
      },
      {
        model: Task,
        as: 'tasks',
        include: [
          {
            model: User,
            as: 'assignee',
            attributes: ['id', 'firstName', 'lastName', 'email'],
          },
        ],
      },
    ],
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check access
  if (user.role === 'user') {
    const isMember = project.members.some((member) => member.id === user.id);
    if (!isMember) {
      throw new ApiError(403, 'You do not have access to this project');
    }
  } else if (user.role === 'manager') {
    const isManagerOrMember = project.managerId === user.id || 
      project.members.some((member) => member.id === user.id);
    if (!isManagerOrMember) {
      throw new ApiError(403, 'You do not have access to this project');
    }
  }

  res.status(200).json({
    success: true,
    data: { project },
  });
});

/**
 * @desc    Create project
 * @route   POST /api/projects
 * @access  Private/Manager
 */
const createProject = asyncHandler(async (req, res) => {
  const { name, description, status, priority, startDate, endDate } = req.body;

  const project = await Project.create({
    name,
    description,
    status,
    priority,
    startDate,
    endDate,
    managerId: req.user.id,
  });

  // Add manager as a member with lead role
  await ProjectMember.create({
    projectId: project.id,
    userId: req.user.id,
    role: 'lead',
  });

  const createdProject = await Project.findByPk(project.id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: ['role'] },
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project: createdProject },
  });
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private/Manager
 */
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, status, priority, startDate, endDate } = req.body;

  const project = await Project.findByPk(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is the manager (admins can also update)
  if (req.user.role !== 'admin' && project.managerId !== req.user.id) {
    throw new ApiError(403, 'Only the project manager can update this project');
  }

  await project.update({
    name: name || project.name,
    description: description !== undefined ? description : project.description,
    status: status || project.status,
    priority: priority || project.priority,
    startDate: startDate !== undefined ? startDate : project.startDate,
    endDate: endDate !== undefined ? endDate : project.endDate,
  });

  const updatedProject = await Project.findByPk(project.id, {
    include: [
      {
        model: User,
        as: 'manager',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        through: { attributes: ['role'] },
      },
    ],
  });

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project: updatedProject },
  });
});

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private/Manager
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is the manager (admins can also delete)
  if (req.user.role !== 'admin' && project.managerId !== req.user.id) {
    throw new ApiError(403, 'Only the project manager can delete this project');
  }

  // Delete all tasks first
  await Task.destroy({ where: { projectId: project.id } });

  // Delete project members
  await ProjectMember.destroy({ where: { projectId: project.id } });

  // Delete project
  await project.destroy();

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
  });
});

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private/Manager
 */
const addMember = asyncHandler(async (req, res) => {
  const { userId, role = 'member' } = req.body;

  const project = await Project.findByPk(req.params.id);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is the manager
  if (req.user.role !== 'admin' && project.managerId !== req.user.id) {
    throw new ApiError(403, 'Only the project manager can add members');
  }

  // Check if user exists
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if user is already a member
  const existingMember = await ProjectMember.findOne({
    where: { projectId: project.id, userId },
  });

  if (existingMember) {
    throw new ApiError(400, 'User is already a member of this project');
  }

  await ProjectMember.create({
    projectId: project.id,
    userId,
    role,
  });

  const updatedProject = await Project.findByPk(project.id, {
    include: [
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        through: { attributes: ['role', 'joinedAt'] },
      },
    ],
  });

  res.status(200).json({
    success: true,
    message: 'Member added successfully',
    data: { members: updatedProject.members },
  });
});

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:userId
 * @access  Private/Manager
 */
const removeMember = asyncHandler(async (req, res) => {
  const { id: projectId, userId } = req.params;

  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is the manager
  if (req.user.role !== 'admin' && project.managerId !== req.user.id) {
    throw new ApiError(403, 'Only the project manager can remove members');
  }

  // Cannot remove the project manager
  if (project.managerId === userId) {
    throw new ApiError(400, 'Cannot remove the project manager from the project');
  }

  const member = await ProjectMember.findOne({
    where: { projectId, userId },
  });

  if (!member) {
    throw new ApiError(404, 'Member not found in this project');
  }

  // Unassign user from all tasks in this project
  await Task.update(
    { assigneeId: null },
    { where: { projectId, assigneeId: userId } }
  );

  await member.destroy();

  res.status(200).json({
    success: true,
    message: 'Member removed successfully',
  });
});

/**
 * @desc    Get project members
 * @route   GET /api/projects/:id/members
 * @access  Private
 */
const getProjectMembers = asyncHandler(async (req, res) => {
  const project = await Project.findByPk(req.params.id, {
    include: [
      {
        model: User,
        as: 'members',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        through: { attributes: ['role', 'joinedAt'] },
      },
    ],
  });

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  res.status(200).json({
    success: true,
    data: { members: project.members },
  });
});

module.exports = {
  getAllProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  getProjectMembers,
};
