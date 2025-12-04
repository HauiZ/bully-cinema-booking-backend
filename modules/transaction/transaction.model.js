const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_config');
const TransactionType = require('../../enums/transaction-type.enum');

const TransactionLog = sequelize.define('TransactionLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  node_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  action_type: {
    type: DataTypes.ENUM(...Object.values(TransactionType).filter(v => typeof v === 'string')),
    allowNull: false,
  },
  description: DataTypes.TEXT,
}, {
  tableName: 'transaction_logs',
  timestamps: true,
  updatedAt: false,
  createdAt: 'created_at',
});

module.exports = TransactionLog;
