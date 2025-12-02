const express = require('express');
const bodyParser = require('body-parser');

const seatRoutes = require('./modules/seat/seat.routes');
const mutexRoutes = require('./modules/mutex/mutex.routes');
const electionRoutes = require('./modules/election/election.routes');
const nodeRoutes = require('./modules/node/node.routes');
const transactionRoutes = require('./modules/transaction/transaction.routes');
const systemRoutes = require('./modules/system/system.routes');

function createApp() {
  const app = express();

  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use('/seats', seatRoutes); // Mount seat routes under /seats
  app.use('/mutex', mutexRoutes); // Mount mutex routes under /mutex
  app.use('/election', electionRoutes); // Mount election routes under /election
  app.use('/nodes', nodeRoutes); // Mount node routes under /nodes
  app.use('/transactions', transactionRoutes); // Mount transaction routes under /transactions
  app.use('/system', systemRoutes); // Mount system routes under /system

  return app;
}

module.exports = { createApp };
