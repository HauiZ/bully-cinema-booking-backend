/**
 * HỆ THỐNG PHÂN TÁN - SEQUELIZE ORM VERSION (Refactor)
 */

require('dotenv').config();
const { createApp } = require('./app');
const { sequelize } = require('./models');
const { startElection, startHeartbeat } = require('./modules/election/election.service');
const swaggerSetup = require('./swagger'); 

const app = createApp();

swaggerSetup(app);

app.listen(process.env.MY_PORT, '0.0.0.0', async () => {
  console.log(`🚀 Node ${process.env.MY_ID} running at Port ${process.env.IP_NETWORK}`);
  console.log(`Swagger docs at http://${process.env.IP_NETWORK}:${process.env.MY_PORT || 3000}/api-docs`);

  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối Database thành công!');
    await sequelize.sync({ alter: false });
  } catch (error) {
    console.error('❌ Không thể kết nối DB:', error.message);
  }

  setTimeout(startElection, 3000);
  startHeartbeat();
});
