const express = require('express');
const { toggleSystem } = require('./system.controller');

const router = express.Router();

router.post('/toggle', toggleSystem);

module.exports = router;
