const express = require('express');
const state = require('../state');
const { processNextInQueue } = require('../services/mutexService');
const dotenv = require('dotenv');
dotenv.config();
const myId = process.env.MY_ID;

const router = express.Router();

// LEADER side: /mutex/acquire
router.post('/mutex/acquire', (req, res) => {
  if (myId !== state.currentLeaderId) return res.status(400).send('Not Leader');

  const { requesterId } = req.body;
  if (!state.isResourceLocked) {
    state.isResourceLocked = true;
    console.log(`🔓 LEADER: Cấp khóa cho Node ${requesterId}`);
    res.send('GRANTED');
  } else {
    console.log(`zzz LEADER: Node ${requesterId} đang xếp hàng.`);
    state.requestQueue.push({ res, requesterId });
  }
});

// LEADER side: /mutex/release
router.post('/mutex/release', (req, res) => {
  if (myId !== state.currentLeaderId) return res.sendStatus(200);
  console.log('🔒 LEADER: Nhận lệnh trả khóa.');
  processNextInQueue();
  res.sendStatus(200);
});

module.exports = router;
