const ElectionStepType = {
  CANDIDATE: "candidate",
  ELECTION: "election",
  VICTORY: "victory",

  getAll: () => Object.values(ElectionStepType).filter(v => typeof v === 'string'),

  isValid: (value) => ElectionStepType.getAll().includes(value),
};

module.exports = ElectionStepType;
