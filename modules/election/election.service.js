const axios = require("axios");
const state = require("../../state");
const { Node, ElectionHistory } = require("../../models");
const { nodes: nodeConfig } = require("../../config/nodes");
const SocketChannel = require("../../enums/socket-channel.enum");
const socketClient = require("../../modules/socket-client/socket.client");
const dotenv = require("dotenv");
const ElectionStepType = require("../../enums/election-step-type.enum");
const { getElectionMessage } = require("../../utils/get-election-message.util");
dotenv.config();

const myId = parseInt(process.env.MY_ID, 10);

// Cooldown to stop heartbeat from triggering too soon
state.leaderCooldownUntil = 0;

// GET /ping
function handlePing(req, res) {
  return res.sendStatus(200);
}

// POST /election
async function handleElection(req, res) {
  const { senderId } = req.body;

  // Respond immediately
  res.sendStatus(200);

  // If I am bigger, I start my own election
  if (myId > senderId) {
    if (!state.isElectionRunning) {
      await startElection();
    }
  }
}

async function handleVictory(req, res) {
  const { leaderId } = req.params;

  state.currentLeaderId = parseInt(leaderId);
  state.isElectionRunning = false;

  // Prevent heartbeat from instantly declaring the new leader dead
  state.leaderCooldownUntil = Date.now() + 3000;

  console.log(`👑 NEW LEADER: NODE ${state.currentLeaderId}`);
  return res.sendStatus(200);
}

async function startElection() {
  if (state.isElectionRunning) return;
  state.isElectionRunning = true;

  const currentNode = await Node.findOne({ where: { id: myId } });
  if (!currentNode) {
    state.isElectionRunning = false;
    return;
  }

  console.log("📢 Starting election...");

  const allNodes = await Node.findAll();
  const higherNodes = allNodes.filter(
    (n) => n.id > myId
  );

  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.CANDIDATE, myId),
    type: ElectionStepType.CANDIDATE,
    nodeId: myId,
  });

  if (higherNodes.length === 0) {
    await declareVictory(allNodes, `Leader ${state.currentLeaderId} is dead`);
    return;
  }

  let anyoneAlive = false;

  await Promise.all(
    higherNodes.map(async (node) => {
      const conf = nodeConfig.find((n) => n.id === node.id);
      if (!conf) return;

      try {
        await axios.post(
          `${conf.url}/election`,
          { senderId: myId },
          { timeout: 800 }
        );
        anyoneAlive = true;
      } catch (_) {}
    })
  );

  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.ELECTION, myId),
    type: ElectionStepType.ELECTION,
    nodeId: myId,
  });

  if (!anyoneAlive) {
    await declareVictory(allNodes, "No higher nodes responded");
  } else {
    setTimeout(() => {
      if (state.isElectionRunning && state.currentLeaderId !== myId) {
        state.isElectionRunning = false;
      }
    }, 5000);
  }
}

async function declareVictory(allNodes, reason) {
  console.log("🎉 I AM THE NEW LEADER!");

  const oldLeaderId = state.currentLeaderId;
  state.currentLeaderId = myId;

  state.leaderCooldownUntil = Date.now() + 3000;

  await Node.update({ isLeader: false }, { where: { isLeader: true } });

  const me = await Node.findByPk(myId);
  me.isLeader = true;
  await me.save();

  await ElectionHistory.create({
    oldLeaderId,
    newLeaderId: myId,
    candidates: JSON.stringify(allNodes.map(n => n.id)),
    reason,
  });

  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.VICTORY, myId),
    type: ElectionStepType.VICTORY,
    nodeId: myId,
  });

  // Broadcast victory to all nodes
  await Promise.all(
    allNodes.map(async (node) => {
      const conf = nodeConfig.find((n) => n.id === node.id);
      if (!conf) return;

      try {
        await axios.post(
          `${conf.url}/election/victory/${myId}`,
          {},
          { timeout: 800 }
        );
      } catch (_) {}
    })
  );

  state.isElectionRunning = false;
}

async function startHeartbeat() {
  setInterval(async () => {
    if (
      state.currentLeaderId === myId ||
      state.isElectionRunning ||
      !state.currentLeaderId ||
      Date.now() < state.leaderCooldownUntil
    ) {
      return;
    }

    const leaderConfig = nodeConfig.find((n) => n.id === state.currentLeaderId);

    if (!leaderConfig) {
      console.log("☠️ Leader missing from config. Election starts.");
      state.currentLeaderId = null;
      return await startElection();
    }

    try {
      await axios.get(`${leaderConfig.url}/ping`, { timeout: 1500 });
    } catch (_) {
      console.log("☠️ Leader unresponsive. Election starting...");
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
