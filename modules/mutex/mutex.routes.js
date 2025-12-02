const express = require('express');
const { acquireLock, releaseLock } = require('./mutex.controller');

const router = express.Router();

// LEADER side: /mutex/acquire
router.post('/mutex/acquire', acquireLock);

// LEADER side: /mutex/release
router.post('/mutex/release', releaseLock);

module.exports = router;
