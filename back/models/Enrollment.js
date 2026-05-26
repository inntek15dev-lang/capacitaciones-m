const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const ScheduleSlot = require('./ScheduleSlot');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  slotId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: ScheduleSlot,
      key: 'id',
    },
  },
  workerId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workerName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workerRut: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  workerCargo: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  contractor: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  evaluation: {
    type: DataTypes.ENUM('pending', 'passed', 'failed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

module.exports = Enrollment;
