const systemService = require('./system.service');

async function toggleSystem(req, res) {
  try {
    const result = await systemService.toggleSystem(req, res);
    res.status(200).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  toggleSystem,
};
