const { TransactionLog, ElectionHistory } = require('../../models');
const { InternalServerError } = require('../../errors/api.error');

async function getTransactions(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const transactions = await TransactionLog.findAll({
      limit,
      order: [['created_at', 'DESC']],
    });
    return transactions;
  } catch (err) {
    console.error('Error fetching transactions:', err);
    throw new InternalServerError();
  }
}

async function getElectionHistory(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const history = await ElectionHistory.findAll({
      limit,
      order: [['created_at', 'DESC']],
    });
    return history;
  } catch (err) {
    console.error('Error fetching election history:', err);
    throw new InternalServerError();
  }
}

module.exports = {
  getTransactions,
  getElectionHistory,
};
