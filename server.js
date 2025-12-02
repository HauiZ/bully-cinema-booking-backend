/**
 * HỆ THỐNG PHÂN TÁN - SEQUELIZE ORM VERSION (Refactor)
 */

require('dotenv').config();
const { createApp } = require('./app');
const { sequelize } = require('./models');
const { startElection, startHeartbeat } = require('./modules/election/election.service');

const app = createApp();

app.listen(process.env.MY_PORT, '0.0.0.0', async () => {
  console.log(`🚀 Node ${process.env.MY_ID} running at Port ${process.env.IP_NETWORK}`);

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
