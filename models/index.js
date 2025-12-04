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

Node.hasMany(ElectionHistory, { as: 'OldLeaderHistory', foreignKey: 'oldLeaderId' });
ElectionHistory.belongsTo(Node, { as: 'OldLeader', foreignKey: 'oldLeaderId' });

Node.hasMany(ElectionHistory, { as: 'NewLeaderHistory', foreignKey: 'newLeaderId' });
ElectionHistory.belongsTo(Node, { as: 'NewLeader', foreignKey: 'newLeaderId' });

module.exports = {
  sequelize,
  Seat,
  TransactionLog,
  Node,
  ElectionHistory,
};
