const { sequelize } = require('../config/db_config');
const Seat = require('./seat');
const TransactionLog = require('./transactionLog');

module.exports = {
  sequelize,
  Seat,
  TransactionLog,
};
