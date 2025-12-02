const express = require('express');
const { getSeats, bookSeat, releaseSeat } = require('./seat.controller');

const router = express.Router();

router.get('/seats', getSeats);
router.post('/seats/book', bookSeat);
router.post('/seats/release', releaseSeat);

module.exports = router;
