const { Node, TransactionLog } = require("../../models");
const {
  NotFoundError,
  InternalServerError,
} = require("../../errors/api.error");
const TransactionType = require("../../enums/transaction-type.enum");
const dotenv = require("dotenv");
const socketClient = require("../../modules/socket-client/socket.client");
dotenv.config();

const myId = parseInt(process.env.MY_ID, 10);

async function getNodes(req, res) {
  try {
    const nodes = await Node.findAll();
    return nodes;
  } catch (err) {
    console.error("Error fetching nodes:", err);
    throw new InternalServerError();
  }
}

async function killNode(req, res) {
  const { id } = req.params;
  try {
    const node = await Node.findByPk(id);
    if (!node) {
      throw new NotFoundError();
    }

    node.isAlive = false;
    await node.save();
    await TransactionLog.create({
      node_id: myId,
      action_type: TransactionType.KILL,
      description: `Node ${id} was killed.`,
    });
    socketClient.sendMessage(TransactionType.KILL, { nodeId: id });
    return { message: `Node ${id} was killed.` };
  } catch (err) {
    console.error(`Error killing node ${id}:`, err);
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new InternalServerError();
  }
}

async function reviveNode(req, res) {
  const { id } = req.params;
  try {
    const node = await Node.findByPk(id);
    if (!node) {
      throw new NotFoundError();
    }

    node.isAlive = true;
    await node.save();
    await TransactionLog.create({
      node_id: myId,
      action_type: TransactionType.REVIVE,
      description: `Node ${id} was revived.`,
    });
    socketClient.sendMessage(TransactionType.REVIVE, { nodeId: id });
    return { message: `Node ${id} was revived.` };
  } catch (err) {
    console.error(`Error reviving node ${id}:`, err);
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new InternalServerError();
  }
}

module.exports = {
  getNodes,
  killNode,
  reviveNode,
};
