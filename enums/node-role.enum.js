/**
 * Enum for node roles
 */
const NodeRole = {
  LEADER: 'LEADER',
  FOLLOWER: 'FOLLOWER',
  
  /**
   * Get all possible values
   * @returns {string[]}
   */
  getAll: () => Object.values(NodeRole),
  
  /**
   * Check if a value is a valid node role
   * @param {string} value
   * @returns {boolean}
   */
  isValid: (value) => NodeRole.getAll().includes(value),
};

module.exports = NodeRole;