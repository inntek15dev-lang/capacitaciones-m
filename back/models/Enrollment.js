const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Worker = require('./Worker');
const ScheduleSlot = require('./ScheduleSlot');

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  evaluation: {
    type: DataTypes.ENUM('pending', 'passed', 'failed'),
    defaultValue: 'pending',
  },
}, {
  timestamps: true,
});

// Relationships
Worker.belongsToMany(ScheduleSlot, { through: Enrollment, foreignKey: 'workerId', as: 'slots' });
ScheduleSlot.belongsToMany(Worker, { through: Enrollment, foreignKey: 'slotId', as: 'workers' });

module.exports = Enrollment;
