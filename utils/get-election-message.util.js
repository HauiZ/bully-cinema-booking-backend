const ElectionStepType = require("../enums/election-step-type.enum");

const getElectionMessage = (type, nodeId) => {
    switch (type) {
        case ElectionStepType.CANDIDATE:
            return `Node ${nodeId} is a candidate for leadership`;
        case ElectionStepType.ELECTION:
            return `Node ${nodeId} sends election message (ID: ${nodeId})`;
        case ElectionStepType.VICTORY:
            return `Node ${nodeId} has the highest ID and wins the election!`;
        default:
            return ''
    }
}

module.exports = { getElectionMessage };
    