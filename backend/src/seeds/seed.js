const { connectDB, sequelize } = require('../config/db');
const { User, Project, Task, ProjectMember } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seed...\n');

    await connectDB();

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Task.destroy({ where: {} });
    await ProjectMember.destroy({ where: {} });
    await Project.destroy({ where: {} });
    await User.destroy({ where: {} });

    // Create Users
    console.log('👤 Creating users...');

    // No need to hash passwords here - the User model's beforeCreate hook will handle it
    const admin = await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@taskflow.com',
      password: 'admin123',
      role: 'admin',
      isActive: true,
    });

    const manager1 = await User.create({
      firstName: 'John',
      lastName: 'Manager',
      email: 'manager@taskflow.com',
      password: 'manager123',
      role: 'manager',
      isActive: true,
    });

    const manager2 = await User.create({
      firstName: 'Sarah',
      lastName: 'Lead',
      email: 'sarah@taskflow.com',
      password: 'manager123',
      role: 'manager',
      isActive: true,
    });

    const user1 = await User.create({
      firstName: 'Alice',
      lastName: 'Developer',
      email: 'user@taskflow.com',
      password: 'user123',
      role: 'user',
      isActive: true,
    });

    const user2 = await User.create({
      firstName: 'Bob',
      lastName: 'Designer',
      email: 'bob@taskflow.com',
      password: 'user123',
      role: 'user',
      isActive: true,
    });

    const user3 = await User.create({
      firstName: 'Charlie',
      lastName: 'Tester',
      email: 'charlie@taskflow.com',
      password: 'user123',
      role: 'user',
      isActive: true,
    });

    console.log('✅ Users created');

    // Create Projects
    console.log('📁 Creating projects...');

    const project1 = await Project.create({
      name: 'E-Commerce Platform',
      description: 'Build a modern e-commerce platform with React and Node.js',
      status: 'active',
      priority: 'high',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      managerId: manager1.id,
    });

    const project2 = await Project.create({
      name: 'Mobile App Development',
      description: 'Develop a cross-platform mobile application',
      status: 'planning',
      priority: 'medium',
      startDate: '2024-02-15',
      endDate: '2024-08-15',
      managerId: manager1.id,
    });

    const project3 = await Project.create({
      name: 'Internal Dashboard',
      description: 'Create an internal analytics dashboard',
      status: 'active',
      priority: 'medium',
      startDate: '2024-01-15',
      endDate: '2024-04-30',
      managerId: manager2.id,
    });

    console.log('✅ Projects created');

    // Add Project Members
    console.log('👥 Adding project members...');

    // Project 1 members
    await ProjectMember.bulkCreate([
      { projectId: project1.id, userId: manager1.id, role: 'lead' },
      { projectId: project1.id, userId: user1.id, role: 'member' },
      { projectId: project1.id, userId: user2.id, role: 'member' },
    ]);

    // Project 2 members
    await ProjectMember.bulkCreate([
      { projectId: project2.id, userId: manager1.id, role: 'lead' },
      { projectId: project2.id, userId: user1.id, role: 'member' },
      { projectId: project2.id, userId: user3.id, role: 'member' },
    ]);

    // Project 3 members
    await ProjectMember.bulkCreate([
      { projectId: project3.id, userId: manager2.id, role: 'lead' },
      { projectId: project3.id, userId: user2.id, role: 'member' },
      { projectId: project3.id, userId: user3.id, role: 'member' },
    ]);

    console.log('✅ Project members added');

    // Create Tasks
    console.log('📋 Creating tasks...');

    // Project 1 tasks
    await Task.bulkCreate([
      {
        title: 'Set up project structure',
        description: 'Initialize React frontend and Node.js backend',
        status: 'done',
        priority: 'high',
        dueDate: '2024-01-15',
        projectId: project1.id,
        assigneeId: user1.id,
        createdById: manager1.id,
      },
      {
        title: 'Design database schema',
        description: 'Create ERD and implement database models',
        status: 'done',
        priority: 'high',
        dueDate: '2024-01-20',
        projectId: project1.id,
        assigneeId: user1.id,
        createdById: manager1.id,
      },
      {
        title: 'Create UI mockups',
        description: 'Design user interface for main pages',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2024-02-01',
        projectId: project1.id,
        assigneeId: user2.id,
        createdById: manager1.id,
      },
      {
        title: 'Implement authentication',
        description: 'Set up JWT-based authentication system',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2024-02-10',
        projectId: project1.id,
        assigneeId: user1.id,
        createdById: manager1.id,
      },
      {
        title: 'Build product catalog',
        description: 'Implement product listing and search functionality',
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-02-28',
        projectId: project1.id,
        assigneeId: user1.id,
        createdById: manager1.id,
      },
      {
        title: 'Shopping cart feature',
        description: 'Implement add to cart and checkout flow',
        status: 'todo',
        priority: 'high',
        dueDate: '2024-03-15',
        projectId: project1.id,
        assigneeId: null,
        createdById: manager1.id,
      },
    ]);

    // Project 2 tasks
    await Task.bulkCreate([
      {
        title: 'Research mobile frameworks',
        description: 'Compare React Native, Flutter, and other options',
        status: 'done',
        priority: 'medium',
        dueDate: '2024-02-20',
        projectId: project2.id,
        assigneeId: user1.id,
        createdById: manager1.id,
      },
      {
        title: 'Set up development environment',
        description: 'Configure mobile development tools and emulators',
        status: 'in-progress',
        priority: 'high',
        dueDate: '2024-02-28',
        projectId: project2.id,
        assigneeId: user3.id,
        createdById: manager1.id,
      },
      {
        title: 'Design app wireframes',
        description: 'Create wireframes for all screens',
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-03-10',
        projectId: project2.id,
        assigneeId: user3.id,
        createdById: manager1.id,
      },
    ]);

    // Project 3 tasks
    await Task.bulkCreate([
      {
        title: 'Gather requirements',
        description: 'Meet with stakeholders to define dashboard needs',
        status: 'done',
        priority: 'high',
        dueDate: '2024-01-20',
        projectId: project3.id,
        assigneeId: user2.id,
        createdById: manager2.id,
      },
      {
        title: 'Design dashboard layout',
        description: 'Create visual design for the dashboard',
        status: 'in-progress',
        priority: 'medium',
        dueDate: '2024-02-05',
        projectId: project3.id,
        assigneeId: user2.id,
        createdById: manager2.id,
      },
      {
        title: 'Implement charts and graphs',
        description: 'Add data visualization components',
        status: 'todo',
        priority: 'medium',
        dueDate: '2024-02-20',
        projectId: project3.id,
        assigneeId: user3.id,
        createdById: manager2.id,
      },
      {
        title: 'Connect to data sources',
        description: 'Integrate with existing databases and APIs',
        status: 'todo',
        priority: 'high',
        dueDate: '2024-03-01',
        projectId: project3.id,
        assigneeId: user3.id,
        createdById: manager2.id,
      },
    ]);

    console.log('✅ Tasks created');

    console.log('\n✨ Database seeding completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('                    TEST CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n📧 Admin:');
    console.log('   Email: admin@taskflow.com');
    console.log('   Password: admin123');
    console.log('\n📧 Manager:');
    console.log('   Email: manager@taskflow.com');
    console.log('   Password: manager123');
    console.log('\n📧 User:');
    console.log('   Email: user@taskflow.com');
    console.log('   Password: user123');
    console.log('\n═══════════════════════════════════════════════════════════\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
