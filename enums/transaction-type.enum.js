/**
 * Enum for transaction types
 */
const TransactionType = {
  LOCK: 'LOCK',
  BUY: 'BUY',
  RELEASE: 'RELEASE',
  ELECTION: 'ELECTION',
  HEARTBEAT: 'HEARTBEAT',
  KILL: 'KILL',
  REVIVE: 'REVIVE',
  
  /**
   * Get all possible values
   * @returns {string[]}
   */
  getAll: () => Object.values(TransactionType).filter(v => typeof v === 'string'),
  
  /**
   * Check if a value is a valid transaction type
   * @param {string} value
   * @returns {boolean}
   */
  isValid: (value) => TransactionType.getAll().includes(value),
};

module.exports = TransactionType;