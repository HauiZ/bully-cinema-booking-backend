const { Server } = require("socket.io");
const dotenv = require("dotenv");
const SocketChannel = require("../enums/socket-channel.enum");
dotenv.config();

const PORT = parseInt(process.env.SOCKET_PORT) || 4000;

const io = new Server({
  cors: {
    origin: "*",
  },
});

let clients = new Set();

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);
  clients.add(socket);

  socket.on(SocketChannel.ELECTION, (msg) => {
    console.log(`Client received election message: ${msg}`);
    socket.broadcast.emit(SocketChannel.ELECTION, msg);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    clients.delete(socket);
  });
});

io.listen(PORT);

console.log(`Socket.IO Server listening on ws://${process.env.IP_NETWORK}:${PORT}`);
