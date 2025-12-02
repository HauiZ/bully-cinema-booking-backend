const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cinema_db',
  process.env.DB_USER_NAME || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST_NAME || 'localhost',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = { sequelize };
