require("dotenv").config();
const { createApp } = require("./app");
const { sequelize, Node } = require("./models"); 
const {
  startElection,
  startHeartbeat,
} = require("./modules/election/election.service");
const socketClient = require("./modules/socket-client/socket.client");
const swaggerSetup = require("./swagger");

const app = createApp();

swaggerSetup(app);

app.listen(process.env.MY_PORT, "0.0.0.0", async () => {
  console.log(
    `🚀 Node ${process.env.MY_ID} running at Port ${process.env.MY_PORT}`
  );
  console.log(
    `Swagger docs at http://${process.env.IP_NETWORK}:${
      process.env.MY_PORT || 3000
    }/api-docs`
  );

  try {
    await sequelize.authenticate();
    console.log("✅ Kết nối Database thành công!");
    await sequelize.sync({ alter: false });
    await Node.update(
      { isLeader: false, isAlive: true }, 
      { where: { id: process.env.MY_ID } }
    );
    console.log(`🔄 Node ${process.env.MY_ID} status reset successfully.`);

  } catch (error) {
    console.error("❌ Không thể kết nối DB:", error.message);
  }

  try {
    socketClient.init();
    setTimeout(startElection, 3000);
    startHeartbeat();
  } catch (error) {
    console.error("❌ Lỗi khởi động logic phân tán:", error.message);
    process.exit(1);
  }
});