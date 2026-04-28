const { DataTypes } = require('sequelize');
const sequelize = require('../database/db');

const Worker = sequelize.define('Worker', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rut: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  hireDate: {
    type: DataTypes.DATEONLY,
  },
  contractor: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Worker;
