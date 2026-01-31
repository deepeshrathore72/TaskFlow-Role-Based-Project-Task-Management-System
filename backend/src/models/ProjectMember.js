const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

// Junction table for User-Project many-to-many relationship
const ProjectMember = sequelize.define(
  'ProjectMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'projects',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.ENUM('member', 'lead'),
      defaultValue: 'member',
      allowNull: false,
    },
    joinedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    timestamps: true,
    tableName: 'project_members',
    indexes: [
      {
        unique: true,
        fields: ['projectId', 'userId'],
      },
    ],
  }
);

module.exports = ProjectMember;
