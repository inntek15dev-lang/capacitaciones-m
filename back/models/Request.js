const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Request = sequelize.define('Request', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  slotId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contractorId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contractorName: {
    type: DataTypes.STRING,
  },
  workerIds: {
    type: DataTypes.JSON, // Array of string IDs
    allowNull: false,
  },
  data: {
    type: DataTypes.JSON, // For any other flexible data
  },
}, {
  timestamps: true,
});

module.exports = Request;
