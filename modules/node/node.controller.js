const nodeService = require('./node.service');

async function getNodes(req, res) {
  try {
    const nodes = await nodeService.getNodes(req, res);
    res.json(nodes);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function killNode(req, res) {
  try {
    const result = await nodeService.killNode(req, res);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function reviveNode(req, res) {
  try {
    const result = await nodeService.reviveNode(req, res);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  getNodes,
  killNode,
  reviveNode,
};
