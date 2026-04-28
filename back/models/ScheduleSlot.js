const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Course = require('./Course');

const ScheduleSlot = sequelize.define('ScheduleSlot', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  start: {
    type: DataTypes.STRING,
  },
  end: {
    type: DataTypes.STRING,
  },
  max: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  courseId: {
    type: DataTypes.STRING,
    references: {
      model: Course,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

Course.hasMany(ScheduleSlot, { foreignKey: 'courseId' });
ScheduleSlot.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = ScheduleSlot;
