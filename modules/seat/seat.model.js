const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db_config');
const SeatStatus = require('../../enums/seat-status.enum');

const Seat = sequelize.define('Seat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  seat_number: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  status: {
    type: DataTypes.ENUM(...Object.values(SeatStatus).filter(v => typeof v === 'string')),
    defaultValue: SeatStatus.AVAILABLE,
  },
  customer_name: { type: DataTypes.STRING(100), allowNull: true },
  booked_by_node_id: { type: DataTypes.INTEGER, allowNull: true },
}, {
  tableName: 'seats',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = Seat;
