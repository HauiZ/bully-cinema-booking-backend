const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_config');

const TransactionLog = sequelize.define('TransactionLog', {
  node_id: DataTypes.STRING,
  action_type: DataTypes.STRING,
  description: DataTypes.TEXT,
}, {
  tableName: 'transaction_logs',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = TransactionLog;
