const { Seat, TransactionLog } = require('../models');
const state = require('../state');
const { acquireLockWithRetry, releaseLock, releaseLocalLock } = require('./mutexService');
const dotenv = require('dotenv');
dotenv.config();

async function buyTicket(req, res) {
  const { seat, customerName } = req.body;
  const myNodeName = `Node ${process.env.MY_ID}`;
  console.log(`🎫 [REQ] Khách ${customerName} muốn mua ghế ${seat}`);

  try {
    // 1. MUTEX: xin quyền
    await acquireLockWithRetry(process.env.MY_ID);

    console.log('✅ ĐƯỢC CẤP QUYỀN! Đang thao tác Database...');

    // 2. CRITICAL SECTION
    const targetSeat = await Seat.findOne({
      where: { seat_number: seat, status: 'AVAILABLE' },
    });

    if (!targetSeat) {
      console.log('❌ Ghế không tồn tại hoặc đã bị đặt.');
      await releaseLock();
      return res.json({ status: 'FAIL', msg: 'Ghế đã hết hoặc không tồn tại!' });
    }

    targetSeat.status = 'BOOKED';
    targetSeat.customer_name = customerName;
    targetSeat.booked_by_node = myNodeName;
    await targetSeat.save();

    await TransactionLog.create({
      node_id: myNodeName,
      action_type: 'BUY',
      description: `Khách ${customerName} mua ghế ${seat}`,
    });

    console.log('💾 Đã lưu DB thành công!');

    // 3. Trả khóa
    await releaseLock();

    return res.json({
      status: 'SUCCESS',
      msg: 'Đặt vé thành công!',
      ticket: targetSeat,
    });
  } catch (err) {
    console.error('❌ Lỗi xử lý:', err.message);
    if (state.currentLeaderId === myId && state.isResourceLocked) {
      releaseLocalLock();
    }
    return res.status(500).json({ error: 'Lỗi hệ thống' });
  }
}

module.exports = {
  buyTicket,
};
