const { Op } = require('sequelize');
const { User, Project, Task, ProjectMember } = require('../models');
const { asyncHandler, ApiError } = require('../middleware');

/**
 * @desc    Get all users (Admin only)
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, isActive } = req.query;
  const offset = (page - 1) * limit;

  // Build where clause
  const where = {};
  
  if (search) {
    where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName: { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  const { count, rows: users } = await User.findAndCountAll({
    where,
    limit: parseInt(limit),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']],
    attributes: { exclude: ['password'] },
  });

  res.status(200).json({
    success: true,
    data: {
      users,
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
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
    include: [
      {
        model: Project,
        as: 'managedProjects',
        attributes: ['id', 'name', 'status'],
      },
      {
        model: Project,
        as: 'projects',
        attributes: ['id', 'name', 'status'],
        through: { attributes: ['role'] },
      },
    ],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Create user (Admin only)
 * @route   POST /api/users
 * @access  Private/Admin
 */
const createUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
  
  if (existingUser) {
    throw new ApiError(400, 'Email already exists');
  }

  const user = await User.create({
    firstName,
    lastName,
    email: email.toLowerCase(),
    password,
    role: role || 'user',
  });

  res.status(201).json({
    success: true,
    message: 'User created successfully',
    data: { user: user.toJSON() },
  });
});

/**
 * @desc    Update user (Admin only)
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
const updateUser = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, role, isActive } = req.body;
  
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Check if email is being changed and if it already exists
  if (email && email.toLowerCase() !== user.email) {
    const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      throw new ApiError(400, 'Email already exists');
    }
  }

  // Prevent admin from deactivating themselves
  if (req.user.id === user.id && isActive === false) {
    throw new ApiError(400, 'You cannot deactivate your own account');
  }

  // Prevent admin from changing their own role
  if (req.user.id === user.id && role && role !== user.role) {
    throw new ApiError(400, 'You cannot change your own role');
  }

  await user.update({
    firstName: firstName || user.firstName,
    lastName: lastName || user.lastName,
    email: email ? email.toLowerCase() : user.email,
    role: role || user.role,
    isActive: isActive !== undefined ? isActive : user.isActive,
  });

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: user.toJSON() },
  });
});

/**
 * @desc    Delete user (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.params.id);

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Prevent admin from deleting themselves
  if (req.user.id === user.id) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  // Check if user is a manager of any projects
  const managedProjects = await Project.count({ where: { managerId: user.id } });
  
  if (managedProjects > 0) {
    throw new ApiError(400, 'Cannot delete user who is managing projects. Reassign projects first.');
  }

  await user.destroy();

  res.status(200).json({
    success: true,
    message: 'User deleted successfully',
  });
});

/**
 * @desc    Get users by role (for assignment dropdowns)
 * @route   GET /api/users/role/:role
 * @access  Private
 */
const getUsersByRole = asyncHandler(async (req, res) => {
  const { role } = req.params;

  if (!['admin', 'manager', 'user'].includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const users = await User.findAll({
    where: { role, isActive: true },
    attributes: ['id', 'firstName', 'lastName', 'email'],
    order: [['firstName', 'ASC']],
  });

  res.status(200).json({
    success: true,
    data: { users },
  });
});

/**
 * @desc    Get all users for assignment (managers and users)
 * @route   GET /api/users/assignable
 * @access  Private/Manager
 */
const getAssignableUsers = asyncHandler(async (req, res) => {
  const users = await User.findAll({
    where: { 
      role: { [Op.in]: ['manager', 'user'] },
      isActive: true,
    },
    attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
    order: [['firstName', 'ASC']],
  });

  res.status(200).json({
    success: true,
    data: { users },
  });
});

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUsersByRole,
  getAssignableUsers,
};
