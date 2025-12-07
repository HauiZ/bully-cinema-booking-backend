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

module.exports = {
  getNodes,
};
