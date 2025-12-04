const axios = require('axios');
const state = require('../../state');
const { nodes } = require('../../config/nodes');
const { startElection } = require('../../modules/election/election.service');
const dotenv = require('dotenv');
dotenv.config();

const myId = parseInt(process.env.MY_ID, 10);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function acquireLockWithRetry(requesterId) {
  while (true) {
    if (state.currentLeaderId === null) {
      console.log('⏳ Chưa có Leader, đợi 1s...');
      await sleep(1000);
      continue;
    }

    try {

      if (state.currentLeaderId === myId) {
        await acquireLocalLock();
      } else {
        const leader = nodes.find((n) => n.id === state.currentLeaderId);
        if (leader) {
          await axios.post(`${leader.url}/mutex/acquire`, { requesterId }, { timeout: 5000 });
        } else {
          throw new Error("Leader not found in config");
        }
      }
      return;
    } catch (error) {
      console.log(
        `⚠️ Không xin được khóa (Leader ${state.currentLeaderId} có thể đã chết). Đang đợi bầu lại...`
      );
      if (state.currentLeaderId !== myId) startElection();
      await sleep(2000);
    }
  }
}

async function releaseLock() {
  console.log('... Đang trả khóa ...');
  if (state.currentLeaderId === myId) {
    releaseLocalLock();
  } else {
    try {
      const leader = nodes.find((n) => n.id === state.currentLeaderId);
      if (leader) await axios.post(`${leader.url}/mutex/release`, { requesterId: myId });
    } catch (e) {
    }
  }
}

function acquireLocalLock() {
  return new Promise((resolve) => {
    if (!state.isResourceLocked) {
      state.isResourceLocked = true;
      resolve();
    } else {
      state.requestQueue.push({ res: { send: resolve }, requesterId: myId });
    }
  });
}

function releaseLocalLock() {
  processNextInQueue();
}

function processNextInQueue() {
  if (state.requestQueue.length > 0) {
    const next = state.requestQueue.shift();
    console.log(`➡️ Chuyển khóa cho Node ${next.requesterId}`);
    if (typeof next.res.send === 'function') {
      next.res.send('GRANTED');
    } else {
      next.res.send('GRANTED');
    }
  } else {
    state.isResourceLocked = false;
    console.log('🏁 Tài nguyên rảnh rỗi.');
  }
}

module.exports = {
  acquireLockWithRetry,
  releaseLock,
  acquireLocalLock,
  releaseLocalLock,
  processNextInQueue,
};