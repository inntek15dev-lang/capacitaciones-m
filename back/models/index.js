const sequelize = require('../database/db');

// Import all models
const Category = require('./Category');
const Course = require('./Course');
const ScheduleSlot = require('./ScheduleSlot');
const Enrollment = require('./Enrollment');
const User = require('./User');
const Request = require('./Request');

// Define associations
Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Course.hasMany(ScheduleSlot, { foreignKey: 'courseId' });
ScheduleSlot.belongsTo(Course, { foreignKey: 'courseId' });

ScheduleSlot.hasMany(Enrollment, { foreignKey: 'slotId', as: 'enrollments' });
Enrollment.belongsTo(ScheduleSlot, { foreignKey: 'slotId' });

module.exports = {
  sequelize,
  Category,
  Course,
  ScheduleSlot,
  Enrollment,
  User,
  Request
};
