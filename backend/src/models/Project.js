const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Project name is required' },
        len: { args: [2, 100], msg: 'Project name must be between 2 and 100 characters' },
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('planning', 'active', 'on-hold', 'completed', 'cancelled'),
      defaultValue: 'planning',
      allowNull: false,
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
      defaultValue: 'medium',
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      validate: {
        isAfterStartDate(value) {
          if (this.startDate && value && new Date(value) < new Date(this.startDate)) {
            throw new Error('End date must be after start date');
          }
        },
      },
    },
    managerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    timestamps: true,
    tableName: 'projects',
  }
);

module.exports = Project;
