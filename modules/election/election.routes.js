const express = require('express');
const {
  handlePing,
  handleElection,
  handleVictory
} = require('./election.controller');

const router = express.Router();

// Internal Bully Algorithm routes
router.get('/ping', handlePing);
router.post('/election', handleElection);
router.post('/victory', handleVictory);

module.exports = router;