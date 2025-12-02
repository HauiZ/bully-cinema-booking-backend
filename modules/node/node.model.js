const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_config');

const Node = sequelize.define('Node', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
  },
  is_alive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  is_leader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  last_heartbeat: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'nodes',
  timestamps: false,
});

module.exports = Node;
