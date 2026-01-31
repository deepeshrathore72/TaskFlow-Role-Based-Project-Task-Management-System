const { Op } = require('sequelize');
const { Task, Project, User, ProjectMember } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get all tasks
 * @route   GET /api/tasks
 * @access  Private
 */
const getAllTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, priority, projectId, assigneeId } = req.query;
  const offset = (page - 1) * limit;
  const { user } = req;

  // Build where clause
  const where = {};

  if (search) {
    where.title = { [Op.iLike]: `%${search}%` };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  let includeOptions = [
    {
      model: Project,
      as: 'project',
      attributes: ['id', 'name', 'status'],
    },
    {
      model: User,
      as: 'assignee',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
    {
      model: User,
      as: 'createdBy',
      attributes: ['id', 'firstName', 'lastName', 'email'],
    },
  ];

  // Filter based on role
  if (user.role === 'user') {
    // Users only see tasks assigned to them
    where.assigneeId = user.id;
  } else if (user.role === 'manager') {
    // Managers see tasks from projects they manage or are members of
    const memberProjects = await ProjectMember.findAll({
      where: { userId: user.id },
      attributes: ['projectId'],
    });

    const managedProjects = await Project.findAll({
      where: { managerId: user.id },
      attributes: ['id'],
    });

    const projectIds = [
      ...new Set([
        ...memberProjects.map((mp) => mp.projectId),
        ...managedProjects.map((mp) => mp.id),
      ]),
    ];

    where.projectId = { [Op.in]: projectIds };
  }

  const { count, rows: tasks } = await Task.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      ['priority', 'DESC'],
      ['dueDate', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    include: includeOptions,
  });

  res.status(200).json({
    success: true,
    data: {
      tasks,
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
 * @desc    Get my tasks (for users)
 * @route   GET /api/tasks/my-tasks
 * @access  Private
 */
const getMyTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, projectId } = req.query;
  const offset = (page - 1) * limit;

  const where = { assigneeId: req.user.id };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (projectId) {
    where.projectId = projectId;
  }

  const { count, rows: tasks } = await Task.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [
      ['priority', 'DESC'],
      ['dueDate', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: {
      tasks,
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
 * @desc    Get single task
 * @route   GET /api/tasks/:id
 * @access  Private
 */
const getTask = asyncHandler(async (req, res) => {
  const { user } = req;

  const task = await Task.findByPk(req.params.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status', 'managerId'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check access
  if (user.role === 'user' && task.assigneeId !== user.id) {
    throw new ApiError(403, 'You do not have access to this task');
  }

  if (user.role === 'manager') {
    const isManagerOrMember = task.project.managerId === user.id ||
      (await ProjectMember.findOne({
        where: { projectId: task.projectId, userId: user.id },
      }));
    
    if (!isManagerOrMember) {
      throw new ApiError(403, 'You do not have access to this task');
    }
  }

  res.status(200).json({
    success: true,
    data: { task },
  });
});

/**
 * @desc    Create task
 * @route   POST /api/tasks
 * @access  Private/Manager
 */
const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
  const { user } = req;

  // Check if project exists
  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check if user is manager of the project or admin
  if (user.role !== 'admin' && project.managerId !== user.id) {
    throw new ApiError(403, 'Only the project manager can create tasks');
  }

  // If assignee is specified, check if they are a member of the project
  if (assigneeId) {
    const isMember = await ProjectMember.findOne({
      where: { projectId, userId: assigneeId },
    });

    if (!isMember) {
      throw new ApiError(400, 'Assignee must be a member of the project');
    }
  }

  const task = await Task.create({
    title,
    description,
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate,
    projectId,
    assigneeId,
    createdById: user.id,
  });

  const createdTask = await Task.findByPk(task.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task: createdTask },
  });
});

/**
 * @desc    Update task
 * @route   PUT /api/tasks/:id
 * @access  Private/Manager
 */
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const { user } = req;

  const task = await Task.findByPk(req.params.id, {
    include: [{ model: Project, as: 'project' }],
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check if user is manager of the project or admin
  if (user.role !== 'admin' && task.project.managerId !== user.id) {
    throw new ApiError(403, 'Only the project manager can update this task');
  }

  // If assignee is changing, verify they are a member
  if (assigneeId && assigneeId !== task.assigneeId) {
    const isMember = await ProjectMember.findOne({
      where: { projectId: task.projectId, userId: assigneeId },
    });

    if (!isMember) {
      throw new ApiError(400, 'Assignee must be a member of the project');
    }
  }

  await task.update({
    title: title || task.title,
    description: description !== undefined ? description : task.description,
    status: status || task.status,
    priority: priority || task.priority,
    dueDate: dueDate !== undefined ? dueDate : task.dueDate,
    assigneeId: assigneeId !== undefined ? assigneeId : task.assigneeId,
  });

  const updatedTask = await Task.findByPk(task.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task: updatedTask },
  });
});

/**
 * @desc    Update task status (for assigned users)
 * @route   PATCH /api/tasks/:id/status
 * @access  Private
 */
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const { user } = req;

  const task = await Task.findByPk(req.params.id, {
    include: [{ model: Project, as: 'project' }],
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check if user is the assignee, project manager, or admin
  const canUpdate = 
    user.role === 'admin' ||
    task.assigneeId === user.id ||
    task.project.managerId === user.id;

  if (!canUpdate) {
    throw new ApiError(403, 'You do not have permission to update this task');
  }

  await task.update({ status });

  const updatedTask = await Task.findByPk(task.id, {
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    message: 'Task status updated successfully',
    data: { task: updatedTask },
  });
});

/**
 * @desc    Delete task
 * @route   DELETE /api/tasks/:id
 * @access  Private/Manager
 */
const deleteTask = asyncHandler(async (req, res) => {
  const { user } = req;

  const task = await Task.findByPk(req.params.id, {
    include: [{ model: Project, as: 'project' }],
  });

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  // Check if user is manager of the project or admin
  if (user.role !== 'admin' && task.project.managerId !== user.id) {
    throw new ApiError(403, 'Only the project manager can delete this task');
  }

  await task.destroy();

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
  });
});

/**
 * @desc    Get tasks by project
 * @route   GET /api/tasks/project/:projectId
 * @access  Private
 */
const getTasksByProject = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assigneeId } = req.query;
  const { user } = req;

  // Verify project exists and user has access
  const project = await Project.findByPk(projectId);

  if (!project) {
    throw new ApiError(404, 'Project not found');
  }

  // Check access
  if (user.role === 'user') {
    const isMember = await ProjectMember.findOne({
      where: { projectId, userId: user.id },
    });
    if (!isMember) {
      throw new ApiError(403, 'You do not have access to this project');
    }
  } else if (user.role === 'manager') {
    const hasAccess = project.managerId === user.id ||
      (await ProjectMember.findOne({ where: { projectId, userId: user.id } }));
    if (!hasAccess) {
      throw new ApiError(403, 'You do not have access to this project');
    }
  }

  const where = { projectId };

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  const tasks = await Task.findAll({
    where,
    order: [
      ['priority', 'DESC'],
      ['dueDate', 'ASC'],
      ['createdAt', 'DESC'],
    ],
    include: [
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
      {
        model: User,
        as: 'createdBy',
        attributes: ['id', 'firstName', 'lastName', 'email'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: { tasks },
  });
});

module.exports = {
  getAllTasks,
  getMyTasks,
  getTask,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByProject,
};
