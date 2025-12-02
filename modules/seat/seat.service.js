const { Seat, TransactionLog } = require('../../models');
const state = require('../../state');
const { acquireLockWithRetry, releaseLock, releaseLocalLock } = require('../../modules/mutex/mutex.service');
const { BadRequestError, NotFoundError, InternalServerError, ConflictError } = require('../../errors/api.error');
const SeatStatus = require('../../enums/seat-status.enum');
const TransactionType = require('../../enums/transaction-type.enum');
const dotenv = require('dotenv');
dotenv.config();

const myId = process.env.MY_ID;

async function getSeats(req, res) {
  try {
    const seats = await Seat.findAll();
    return seats;
  } catch (err) {
    console.error('Error fetching seats:', err);
    throw new InternalServerError(err.me);
  }
}

async function bookSeat(req, res) {
  const { seatId, customerName } = req.body;
  console.log(`[REQ] Customer ${customerName} wants to book seat ${seatId}`);

  await acquireLockWithRetry(myId);

  console.log('Lock acquired! Accessing critical section...');

  const targetSeat = await Seat.findOne({
    where: { seat_number: seatId, status: SeatStatus.AVAILABLE },
  });

  if (!targetSeat) {
    console.log('Seat not available or does not exist.');
    await releaseLock();
    throw new ConflictError();
  }

  targetSeat.status = SeatStatus.BOOKED;
  targetSeat.customer_name = customerName;
  targetSeat.booked_by_node_id = myId;
  await targetSeat.save();

  await TransactionLog.create({
    node_id: myId,
    action_type: TransactionType.BUY,
    description: `Customer ${customerName} bought Seat ${seatId}`,
  });

  console.log('Database updated successfully!');

  await releaseLock();

  return targetSeat;
}

async function releaseSeat(req, res) {
  const { seatId } = req.body;
  console.log(`[REQ] Releasing seat ${seatId}`);

  await acquireLockWithRetry(myId);

  console.log('Lock acquired! Accessing critical section...');

  const targetSeat = await Seat.findOne({
    where: { seat_number: seatId, status: SeatStatus.BOOKED },
  });

  if (!targetSeat) {
    console.log('Seat not booked or does not exist.');
    await releaseLock();
    throw new NotFoundError();
  }

  const previous_customer = targetSeat.customer_name;
  targetSeat.status = SeatStatus.AVAILABLE;
  targetSeat.customer_name = null;
  targetSeat.booked_by_node_id = null;
  await targetSeat.save();

  await TransactionLog.create({
    node_id: myId,
    action_type: TransactionType.RELEASE,
    description: `Seat ${seatId} released (was booked by ${previous_customer})`,
  });

  console.log('Database updated successfully!');

  await releaseLock();

  return targetSeat;
}

module.exports = {
  getSeats,
  bookSeat,
  releaseSeat,
};
