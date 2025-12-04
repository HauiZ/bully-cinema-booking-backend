const ElectionStepType = {
  CANDIDATE: "candidate",
  ELECTION: "election",
  VICTORY: "victory",

  getAll: () => Object.values(ElectionStepType),

  isValid: (value) => ElectionStepType.getAll().includes(value),
};

module.exports = ElectionStepType;
