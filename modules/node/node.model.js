const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_config');

const Node = sequelize.define('Node', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  isLeader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  lastHeartbeat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'nodes',
  timestamps: false,
  underscored: true
});

module.exports = Node;
