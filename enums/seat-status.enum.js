/**
 * Enum for seat statuses
 */
const SeatStatus = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  
  /**
   * Get all possible values
   * @returns {string[]}
   */
  getAll: () => Object.values(SeatStatus),
  
  /**
   * Check if a value is a valid seat status
   * @param {string} value
   * @returns {boolean}
   */
  isValid: (value) => SeatStatus.getAll().includes(value),
};

module.exports = SeatStatus;