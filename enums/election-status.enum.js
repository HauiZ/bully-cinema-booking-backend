/**
 * Enum for election statuses
 */
const ElectionStatus = {
  NOT_RUNNING: 'NOT_RUNNING',
  RUNNING: 'RUNNING',
  
  /**
   * Get all possible values
   * @returns {string[]}
   */
  getAll: () => Object.values(ElectionStatus),
  
  /**
   * Check if a value is a valid election status
   * @param {string} value
   * @returns {boolean}
   */
  isValid: (value) => ElectionStatus.getAll().includes(value),
};

module.exports = ElectionStatus;