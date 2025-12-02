const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db_config');

const Seat = sequelize.define('Seat', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  seat_number: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: {
    type: DataTypes.ENUM('AVAILABLE', 'BOOKED'),
    defaultValue: 'AVAILABLE',
  },
  customer_name: { type: DataTypes.STRING, allowNull: true },
  booked_by_node: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'seats',
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});

module.exports = Seat;
