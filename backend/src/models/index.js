const User = require('./User');
const Project = require('./Project');
const Task = require('./Task');
const ProjectMember = require('./ProjectMember');

// ==================== User - Project Associations ====================

// A project belongs to a manager (user)
Project.belongsTo(User, {
  foreignKey: 'managerId',
  as: 'manager',
});

// A user (manager) can have many projects
User.hasMany(Project, {
  foreignKey: 'managerId',
  as: 'managedProjects',
});

// ==================== Project Members (Many-to-Many) ====================

// A project has many members through ProjectMember
Project.belongsToMany(User, {
  through: ProjectMember,
  foreignKey: 'projectId',
  otherKey: 'userId',
  as: 'members',
});

// A user can be a member of many projects
User.belongsToMany(Project, {
  through: ProjectMember,
  foreignKey: 'userId',
  otherKey: 'projectId',
  as: 'projects',
});

// Direct associations for ProjectMember
ProjectMember.belongsTo(User, { foreignKey: 'userId', as: 'user' });
ProjectMember.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// ==================== Task Associations ====================

// A task belongs to a project
Task.belongsTo(Project, {
  foreignKey: 'projectId',
  as: 'project',
  onDelete: 'CASCADE',
});

// A project has many tasks
Project.hasMany(Task, {
  foreignKey: 'projectId',
  as: 'tasks',
  onDelete: 'CASCADE',
});

// A task can be assigned to a user
Task.belongsTo(User, {
  foreignKey: 'assigneeId',
  as: 'assignee',
});

// A user can have many assigned tasks
User.hasMany(Task, {
  foreignKey: 'assigneeId',
  as: 'assignedTasks',
});

// A task is created by a user
Task.belongsTo(User, {
  foreignKey: 'createdById',
  as: 'createdBy',
});

// A user has created many tasks
User.hasMany(Task, {
  foreignKey: 'createdById',
  as: 'createdTasks',
});

module.exports = {
  User,
  Project,
  Task,
  ProjectMember,
};
