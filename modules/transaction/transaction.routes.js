const express = require('express');
const { getTransactions, getElectionHistory } = require('./transaction.controller');

const router = express.Router();

router.get('/', getTransactions);
router.get('/history', getElectionHistory);

module.exports = router;
