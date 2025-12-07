const nodeService = require('./node.service');

async function getNodes(req, res) {
  try {
    const nodes = await nodeService.getNodes(req, res);
    res.json(nodes);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  getNodes,
};
