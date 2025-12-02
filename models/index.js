const { sequelize } = require('../config/db_config');
const Seat = require('../modules/seat/seat.model');
const TransactionLog = require('../modules/transaction/transaction.model');
const Node = require('../modules/node/node.model');
const ElectionHistory = require('../modules/election/election.model');

// Define associations
Node.hasMany(Seat, { foreignKey: 'booked_by_node_id' });
Seat.belongsTo(Node, { foreignKey: 'booked_by_node_id' });

Node.hasMany(TransactionLog, { foreignKey: 'node_id' });
TransactionLog.belongsTo(Node, { foreignKey: 'node_id' });

Node.hasMany(ElectionHistory, { as: 'OldLeaderHistory', foreignKey: 'old_leader_id' });
ElectionHistory.belongsTo(Node, { as: 'OldLeader', foreignKey: 'old_leader_id' });

Node.hasMany(ElectionHistory, { as: 'NewLeaderHistory', foreignKey: 'new_leader_id' });
ElectionHistory.belongsTo(Node, { as: 'NewLeader', foreignKey: 'new_leader_id' });

module.exports = {
  sequelize,
  Seat,
  TransactionLog,
  Node,
  ElectionHistory,
};
