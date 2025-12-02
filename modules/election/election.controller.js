const electionService = require('./election.service');

async function handlePing(req, res) {
  try {
    const result = await electionService.handlePing(req, res);
    res.status(200).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function handleElection(req, res) {
  try {
    const result = await electionService.handleElection(req, res);
    res.status(200).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

async function handleVictory(req, res) {
  try {
    const result = await electionService.handleVictory(req, res);
    res.status(200).send();
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
}

module.exports = {
  handlePing,
  handleElection,
  handleVictory,
};