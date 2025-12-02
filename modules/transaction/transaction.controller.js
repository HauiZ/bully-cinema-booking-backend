const transactionService = require('./transaction.service');

async function getTransactions(req, res) {
  try {
    const transactions = await transactionService.getTransactions(req, res);
    res.json(transactions);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function getElectionHistory(req, res) {
  try {
    const history = await transactionService.getElectionHistory(req, res);
    res.json(history);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  getTransactions,
  getElectionHistory,
};
