const axios = require("axios");
const state = require("../../state");
const { Node, ElectionHistory } = require("../../models");
const { nodes: nodeConfig } = require("../../config/nodes");
const { InternalServerError } = require("../../errors/api.error");
const SocketChannel = require("../../enums/socket-channel.enum");
const socketClient = require("../../modules/socket-client/socket.client");
const dotenv = require("dotenv");
const ElectionStepType = require("../../enums/election-step-type.enum");
const { getElectionMessage } = require("../../utils/get-election-message.util");
dotenv.config();

const myId = parseInt(process.env.MY_ID, 10);

function handlePing(req, res) {
  return res.sendStatus(200);
}

async function handleElection(req, res) {
  const { senderId } = req.body;
  if (myId > senderId) {
    res.sendStatus(200);
    // Only start election if no election is currently running
    if (!state.isElectionRunning) {
      await startElection(); // I am bigger, I will start an election
    }
  } else {
    res.sendStatus(200);
  }
}

async function handleVictory(req, res) {
  const { leaderId, candidates, reason } = req.body;
  const oldLeaderId = state.currentLeaderId;
  state.currentLeaderId = leaderId;
  state.isElectionRunning = false;

  await Node.update({ isLeader: false }, { where: { isLeader: true } });
  await Node.update({ isLeader: true }, { where: { id: leaderId } });

  await ElectionHistory.create({
    oldLeaderId: oldLeaderId,
    newLeaderId: leaderId,
    candidates: JSON.stringify(candidates),
    reason,
  });

  console.log(`👑 NEW LEADER: NODE ${state.currentLeaderId}`);
  res.sendStatus(200);
}

async function startElection() {
  // Use a more atomic approach to check and set election state to prevent race conditions
  if (state.isElectionRunning) return;

  // Set the flag immediately to prevent other processes from starting elections
  state.isElectionRunning = true;

  const currentNode = await Node.findOne({ where: { id: myId } });
  if (!myId || !currentNode || currentNode.isLeader || !currentNode.isAlive) {
    // Reset election state if conditions are not met
    state.isElectionRunning = false;
    return;
  }

  const reason = `Leader ${state.currentLeaderId} is down. starting election...`;
  console.log("📢 Starting election...");

  const allNodes = await Node.findAll({ where: { isAlive: true } });
  const higherNodes = allNodes.filter((n) => n.id > myId);

  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.CANDIDATE, myId),
    type: ElectionStepType.CANDIDATE,
    nodeId: myId,
  });

  if (higherNodes.length === 0) {
    await declareVictory(allNodes, reason);
    return;
  }

  let anyoneAlive = false;
  const electionPromises = higherNodes.map(async (node) => {
    const nodeConfigDetails = nodeConfig.find((n) => n.id === node.id);
    if (!nodeConfigDetails) return;
    try {
      await axios.post(
        `${nodeConfigDetails.url}/election`,
        { senderId: myId },
        { timeout: 1000 }
      );
      anyoneAlive = true;
    } catch (e) { }
  });

  await Promise.all(electionPromises);

  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.ELECTION, myId),
    type: ElectionStepType.ELECTION,
    nodeId: myId,
  });

  if (!anyoneAlive) {
    await declareVictory(allNodes, reason);
  } else {
    // Wait for a potential victory message from a higher node
    // Use a more robust timeout mechanism that can be cleared if we receive a victory
    setTimeout(async () => {
      // Only reset if we're still in an election state and haven't become leader
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

  await Node.update({ isLeader: false }, { where: { isLeader: true } });
  const me = await Node.findByPk(myId);
  if (!me) {
    // Reset election state if we couldn't update our own status
    state.isElectionRunning = false;
    return;
  }
  me.isLeader = true;
  await me.save();

  const candidates = allNodes.map((n) => n.id);

  await ElectionHistory.create({
    oldLeaderId: oldLeaderId,
    newLeaderId: myId,
    candidates: JSON.stringify(candidates),
    reason,
  });

  const victoryPromises = allNodes.map(async (node) => {
    const nodeConfigDetails = nodeConfig.find((n) => n.id === node.id);
    if (node.id !== myId && nodeConfigDetails) {
      try {
        await axios.post(`${nodeConfigDetails.url}/victory`, {
          leaderId: myId,
          candidates,
          reason,
        });
      } catch (e) {
        // Node is unresponsive
      }
    }
  });
  socketClient.sendMessage(SocketChannel.ELECTION, {
    message: getElectionMessage(ElectionStepType.VICTORY, myId),
    type: ElectionStepType.VICTORY,
    nodeId: myId,
  });
  await Promise.all(victoryPromises);

  // Ensure election state is properly reset after victory is declared
  state.isElectionRunning = false;
}

async function startHeartbeat() {
  setInterval(async () => {
    // Only proceed if I'm not the leader, no election is running, and there is a leader to check
    if (
      state.currentLeaderId === myId ||
      state.isElectionRunning ||
      !state.currentLeaderId
    )
      return;

    const leader = await Node.findByPk(state.currentLeaderId);
    const leaderConfig = nodeConfig.find((n) => n.id === state.currentLeaderId);

    if (!leader || !leaderConfig || !leader.isAlive) {
      console.log("☠️ Leader is marked as dead. Starting a new election!");
      state.currentLeaderId = null;
      await startElection();
      return;
    }

    try {
      await axios.get(`${leaderConfig.url}/ping`, { timeout: 2000 });
    } catch (e) {
      console.log(
        "☠️ Leader is unresponsive. Marking as dead and starting election!"
      );
      // Update leader status in DB
      leader.isAlive = false;
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
