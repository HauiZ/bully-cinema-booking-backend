const axios = require('axios');
const state = require('../state');
const { nodes } = require('../config/nodes');
const dotenv = require('dotenv');
dotenv.config();

const myId = process.env.MY_ID;

// GET /ping
function handlePing(req, res) {
  return res.sendStatus(200);
}

// POST /election
function handleElection(req, res) {
  const { senderId } = req.body;
  if (myId > senderId) {
    res.sendStatus(200);
    startElection(); // tôi to hơn, tôi tranh cử tiếp
  } else {
    res.sendStatus(200);
  }
}

// POST /victory
function handleVictory(req, res) {
  const { leaderId } = req.body;
  state.currentLeaderId = leaderId;
  state.isElectionRunning = false;
  state.isResourceLocked = false;
  state.requestQueue = [];
  console.log(`👑 LEADER MỚI: NODE ${state.currentLeaderId}`);
  res.sendStatus(200);
}

async function startElection() {
  if (state.isElectionRunning) return;
  state.isElectionRunning = true;
  console.log('📢 Bắt đầu bầu cử...');

  const higherNodes = nodes.filter((n) => n.id > myId);
  if (higherNodes.length === 0) {
    declareVictory();
    return;
  }

  let anyoneAlive = false;

  await Promise.all(
    higherNodes.map(async (node) => {
      try {
        await axios.post(`${node.url}/election`, { senderId: myId }, { timeout: 1000 });
        anyoneAlive = true;
      } catch (e) {
        // node đó chết
      }
    })
  );

  if (!anyoneAlive) {
    declareVictory();
  } else {
    setTimeout(() => {
      if (state.currentLeaderId === null || state.currentLeaderId < myId) {
        state.isElectionRunning = false;
        startElection();
      }
    }, 5000);
  }
}

function declareVictory() {
  console.log('🎉 TÔI LÀ LEADER!');
  state.currentLeaderId = myId;
  state.isElectionRunning = false;
  state.isResourceLocked = false;
  state.requestQueue = [];

  nodes.forEach((n) => {
    if (n.id !== myId) {
      axios.post(`${n.url}/victory`, { leaderId: myId }).catch(() => {});
    }
  });
}

function startHeartbeat() {
  setInterval(async () => {
    if (state.currentLeaderId === myId || state.isElectionRunning || !state.currentLeaderId) return;
    const leader = nodes.find((n) => n.id === state.currentLeaderId);
    if (!leader) return;

    try {
      await axios.get(`${leader.url}/ping`, { timeout: 2000 });
    } catch (e) {
      console.log('☠️ Leader chết. Bầu lại!');
      state.currentLeaderId = null;
      startElection();
    }
  }, 3000);
}

module.exports = {
  handlePing,
  handleElection,
  handleVictory,
  startElection,
  startHeartbeat,
};
