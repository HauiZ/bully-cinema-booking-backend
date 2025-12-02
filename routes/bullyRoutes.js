const express = require('express');
const { handlePing, handleElection, handleVictory } = require('../services/bullyService');

const router = express.Router();

router.get('/ping', handlePing);
router.post('/election', handleElection);
router.post('/victory', handleVictory);

module.exports = router;
