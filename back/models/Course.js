const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');
const Category = require('./Category');

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  maxPerSlot: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  categoryId: {
    type: DataTypes.STRING,
    references: {
      model: Category,
      key: 'id',
    },
  },
}, {
  timestamps: true,
});

Category.hasMany(Course, { foreignKey: 'categoryId', as: 'courses' });
Course.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

module.exports = Course;
