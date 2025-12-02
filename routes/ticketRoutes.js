const express = require('express');
const { buyTicket } = require('../services/ticketService');

const router = express.Router();

router.post('/buy-ticket', buyTicket);

module.exports = router;
