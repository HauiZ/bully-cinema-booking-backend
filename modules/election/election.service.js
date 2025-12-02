const axios = require('axios');
const state = require('../../state');
const { Node, ElectionHistory } = require('../../models');
const { nodes: nodeConfig } = require('../../config/nodes');
const { InternalServerError } = require('../../errors/api.error');
const TransactionType = require('../../enums/transaction-type.enum');
const dotenv = require('dotenv');
dotenv.config();

const myId = parseInt(process.env.MY_ID, 10);

// GET /ping
function handlePing(req, res) {
  return res.sendStatus(200);
}

// POST /election
async function handleElection(req, res) {
  const { senderId } = req.body;
  if (myId > senderId) {
    res.sendStatus(200);
    await startElection(); // I am bigger, I will start an election
  } else {
    res.sendStatus(200);
  }
}

// POST /victory
async function handleVictory(req, res) {
  const { leaderId, candidates, reason } = req.body;
  const oldLeaderId = state.currentLeaderId;
  state.currentLeaderId = leaderId;
  state.isElectionRunning = false;
  
  await Node.update({ is_leader: false }, { where: { is_leader: true } });
  await Node.update({ is_leader: true }, { where: { id: leaderId } });

  await ElectionHistory.create({
      old_leader_id: oldLeaderId,
      new_leader_id: leaderId,
      candidates: JSON.stringify(candidates),
      reason,
  });

  console.log(`👑 NEW LEADER: NODE ${state.currentLeaderId}`);
  res.sendStatus(200);
}

async function startElection() {
  if (state.isElectionRunning) return;
  state.isElectionRunning = true;
  const reason = `Leader ${state.currentLeaderId} is down.`;
  console.log('📢 Starting election...');

  const allNodes = await Node.findAll({ where: { is_alive: true } });
  const higherNodes = allNodes.filter((n) => n.id > myId);

  if (higherNodes.length === 0) {
    await declareVictory(allNodes, reason);
    return;
  }

  let anyoneAlive = false;
  const electionPromises = higherNodes.map(async (node) => {
    const nodeConfigDetails = nodeConfig.find(n => n.id === node.id);
    if (!nodeConfigDetails) return;
    try {
      await axios.post(`${nodeConfigDetails.url}/election`, { senderId: myId }, { timeout: 1000 });
      anyoneAlive = true;
    } catch (e) {
      // Node is unresponsive
    }
  });

  await Promise.all(electionPromises);

  if (!anyoneAlive) {
    await declareVictory(allNodes, reason);
  } else {
    // Wait for a potential victory message from a higher node
    setTimeout(async () => {
        state.isElectionRunning = false;
    }, 5000);
  }
}

async function declareVictory(allNodes, reason) {
  console.log('🎉 I AM THE NEW LEADER!');
  const oldLeaderId = state.currentLeaderId;
  state.currentLeaderId = myId;
  state.isElectionRunning = false;

  await Node.update({ is_leader: false }, { where: { is_leader: true } });
  const me = await Node.findByPk(myId);
  if (!me) return;
  me.is_leader = true;
  await me.save();
  
  const candidates = allNodes.map(n => n.id);

  await ElectionHistory.create({
    old_leader_id: oldLeaderId,
    new_leader_id: myId,
    candidates: JSON.stringify(candidates),
    reason,
  });

  const victoryPromises = allNodes.map(async (node) => {
    const nodeConfigDetails = nodeConfig.find(n => n.id === node.id);
    if (node.id !== myId && nodeConfigDetails) {
      try {
        await axios.post(`${nodeConfigDetails.url}/victory`, { leaderId: myId, candidates, reason });
      } catch (e) {
        // Node is unresponsive
      }
    }
  });
  await Promise.all(victoryPromises);
}

async function startHeartbeat() {
    setInterval(async () => {
      if (state.currentLeaderId === myId || state.isElectionRunning || !state.currentLeaderId) return;
      
      const leader = await Node.findByPk(state.currentLeaderId);
      const leaderConfig = nodeConfig.find(n => n.id === state.currentLeaderId);

      if (!leader || !leaderConfig || !leader.is_alive) {
          console.log('☠️ Leader is marked as dead. Starting a new election!');
          state.currentLeaderId = null;
          await startElection();
          return;
      }

      try {
          await axios.get(`${leaderConfig.url}/ping`, { timeout: 2000 });
      } catch (e) {
          console.log('☠️ Leader is unresponsive. Marking as dead and starting election!');
          leader.is_alive = false;
          await leader.save();
          state.currentLeaderId = null;
          await startElection();
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