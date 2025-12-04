const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_config');

const ElectionHistory = sequelize.define('ElectionHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  oldLeaderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  newLeaderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  candidates: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  reason: {
    type: DataTypes.STRING(255),
  },
}, {
  tableName: 'election_history',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
  underscored: true
});

module.exports = ElectionHistory;
