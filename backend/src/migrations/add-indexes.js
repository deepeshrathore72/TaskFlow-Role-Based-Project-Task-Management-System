const { sequelize } = require('../config/db');

/**
 * Add database indexes for improved query performance
 * Run this script to optimize database queries
 */

async function addIndexes() {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔧 Adding database indexes...');

    // Users table indexes
    await queryInterface.addIndex('users', ['email'], {
      name: 'users_email_idx',
      unique: true,
      concurrently: true,
    }).catch(() => console.log('Index users_email_idx already exists'));

    await queryInterface.addIndex('users', ['role'], {
      name: 'users_role_idx',
      concurrently: true,
    }).catch(() => console.log('Index users_role_idx already exists'));

    await queryInterface.addIndex('users', ['isActive'], {
      name: 'users_isActive_idx',
      concurrently: true,
    }).catch(() => console.log('Index users_isActive_idx already exists'));

    // Projects table indexes
    await queryInterface.addIndex('projects', ['managerId'], {
      name: 'projects_managerId_idx',
      concurrently: true,
    }).catch(() => console.log('Index projects_managerId_idx already exists'));

    await queryInterface.addIndex('projects', ['status'], {
      name: 'projects_status_idx',
      concurrently: true,
    }).catch(() => console.log('Index projects_status_idx already exists'));

    await queryInterface.addIndex('projects', ['priority'], {
      name: 'projects_priority_idx',
      concurrently: true,
    }).catch(() => console.log('Index projects_priority_idx already exists'));

    await queryInterface.addIndex('projects', ['createdAt'], {
      name: 'projects_createdAt_idx',
      concurrently: true,
    }).catch(() => console.log('Index projects_createdAt_idx already exists'));

    // Tasks table indexes
    await queryInterface.addIndex('tasks', ['projectId'], {
      name: 'tasks_projectId_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_projectId_idx already exists'));

    await queryInterface.addIndex('tasks', ['assigneeId'], {
      name: 'tasks_assigneeId_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_assigneeId_idx already exists'));

    await queryInterface.addIndex('tasks', ['createdById'], {
      name: 'tasks_createdById_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_createdById_idx already exists'));

    await queryInterface.addIndex('tasks', ['status'], {
      name: 'tasks_status_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_status_idx already exists'));

    await queryInterface.addIndex('tasks', ['priority'], {
      name: 'tasks_priority_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_priority_idx already exists'));

    await queryInterface.addIndex('tasks', ['dueDate'], {
      name: 'tasks_dueDate_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_dueDate_idx already exists'));

    // Composite indexes for common queries
    await queryInterface.addIndex('tasks', ['projectId', 'status'], {
      name: 'tasks_projectId_status_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_projectId_status_idx already exists'));

    await queryInterface.addIndex('tasks', ['assigneeId', 'status'], {
      name: 'tasks_assigneeId_status_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_assigneeId_status_idx already exists'));

    await queryInterface.addIndex('tasks', ['status', 'dueDate'], {
      name: 'tasks_status_dueDate_idx',
      concurrently: true,
    }).catch(() => console.log('Index tasks_status_dueDate_idx already exists'));

    // ProjectMembers table indexes
    await queryInterface.addIndex('project_members', ['projectId'], {
      name: 'project_members_projectId_idx',
      concurrently: true,
    }).catch(() => console.log('Index project_members_projectId_idx already exists'));

    await queryInterface.addIndex('project_members', ['userId'], {
      name: 'project_members_userId_idx',
      concurrently: true,
    }).catch(() => console.log('Index project_members_userId_idx already exists'));

    await queryInterface.addIndex('project_members', ['projectId', 'userId'], {
      name: 'project_members_projectId_userId_idx',
      unique: true,
      concurrently: true,
    }).catch(() => console.log('Index project_members_projectId_userId_idx already exists'));

    console.log('✅ Database indexes added successfully!');
    console.log('\n📈 Performance optimizations:');
    console.log('  - Email lookups (login/auth)');
    console.log('  - Role-based filtering');
    console.log('  - Project and task queries by status/priority');
    console.log('  - Task assignments and overdue checks');
    console.log('  - Project member lookups');
    
  } catch (error) {
    console.error('❌ Error adding indexes:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  addIndexes()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { addIndexes };
