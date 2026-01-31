const { Op } = require('sequelize');
const { User, Project, Task, ProjectMember } = require('../models');
const { asyncHandler } = require('../middleware');

/**
 * @desc    Get dashboard stats
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  const { user } = req;
  let stats = {};

  if (user.role === 'admin') {
    // Admin sees everything
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { isActive: true } });
    const totalProjects = await Project.count();
    const totalTasks = await Task.count();

    const tasksByStatus = await Task.count({ group: ['status'] });
    const projectsByStatus = await Project.count({ group: ['status'] });

    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt'],
    });

    stats = {
      totalUsers,
      activeUsers,
      totalProjects,
      totalTasks,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      projectsByStatus: projectsByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      recentUsers,
    };
  } else if (user.role === 'manager') {
    // Manager sees their projects and team stats
    const managedProjects = await Project.count({ where: { managerId: user.id } });
    
    // Get all projects managed by user
    const projects = await Project.findAll({
      where: { managerId: user.id },
      attributes: ['id'],
    });
    
    const projectIds = projects.map((p) => p.id);

    const totalTasks = await Task.count({ where: { projectId: { [Op.in]: projectIds } } });
    
    const tasksByStatus = await Task.count({
      where: { projectId: { [Op.in]: projectIds } },
      group: ['status'],
    });

    // Get unique team members across all projects
    const teamMembers = await ProjectMember.count({
      where: { projectId: { [Op.in]: projectIds } },
      distinct: true,
      col: 'userId',
    });

    const overdueTasks = await Task.count({
      where: {
        projectId: { [Op.in]: projectIds },
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'done' },
      },
    });

    stats = {
      managedProjects,
      totalTasks,
      teamMembers,
      overdueTasks,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  } else {
    // User sees their assigned tasks
    const assignedTasks = await Task.count({ where: { assigneeId: user.id } });
    
    const tasksByStatus = await Task.count({
      where: { assigneeId: user.id },
      group: ['status'],
    });

    // Get projects user is member of
    const memberProjects = await ProjectMember.count({
      where: { userId: user.id },
    });

    const overdueTasks = await Task.count({
      where: {
        assigneeId: user.id,
        dueDate: { [Op.lt]: new Date() },
        status: { [Op.ne]: 'done' },
      },
    });

    const completedThisWeek = await Task.count({
      where: {
        assigneeId: user.id,
        status: 'done',
        updatedAt: {
          [Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    stats = {
      assignedTasks,
      memberProjects,
      overdueTasks,
      completedThisWeek,
      tasksByStatus: tasksByStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
    };
  }

  res.status(200).json({
    success: true,
    data: { stats },
  });
});

/**
 * @desc    Get recent activity
 * @route   GET /api/dashboard/activity
 * @access  Private
 */
const getRecentActivity = asyncHandler(async (req, res) => {
  const { user } = req;
  const { limit = 10 } = req.query;

  let where = {};

  if (user.role === 'manager') {
    const projects = await Project.findAll({
      where: { managerId: user.id },
      attributes: ['id'],
    });
    where.projectId = { [Op.in]: projects.map((p) => p.id) };
  } else if (user.role === 'user') {
    where.assigneeId = user.id;
  }

  const recentTasks = await Task.findAll({
    where,
    order: [['updatedAt', 'DESC']],
    limit: parseInt(limit),
    include: [
      {
        model: Project,
        as: 'project',
        attributes: ['id', 'name'],
      },
      {
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName'],
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: { recentTasks },
  });
});

module.exports = {
  getDashboardStats,
  getRecentActivity,
};
