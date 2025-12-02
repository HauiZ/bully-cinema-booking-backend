const seatService = require('./seat.service');

async function getSeats(req, res) {
  try {
    const seats = await seatService.getSeats(req, res);
    res.json(seats);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function bookSeat(req, res) {
  try {
    const result = await seatService.bookSeat(req, res);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function releaseSeat(req, res) {
  try {
    const result = await seatService.releaseSeat(req, res);
    res.json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  getSeats,
  bookSeat,
  releaseSeat,
};
