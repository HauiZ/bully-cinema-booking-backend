const { InternalServerError } = require('../../errors/api.error');

function toggleSystem(req, res) {
  const { active } = req.body;
  // This is a simulation toggle, actual implementation would be more complex
  console.log(`System simulation toggled to: ${active}`);
  res.status(200).send();
}

module.exports = {
  toggleSystem,
};
