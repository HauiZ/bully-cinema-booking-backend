const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const seatRoutes = require('./modules/seat/seat.routes');
const mutexRoutes = require('./modules/mutex/mutex.routes');
const electionRoutes = require('./modules/election/election.routes');
const nodeRoutes = require('./modules/node/node.routes');
const transactionRoutes = require('./modules/transaction/transaction.routes');
const systemRoutes = require('./modules/system/system.routes');
const morgan = require('morgan');

function createApp() {
  const app = express();

  app.use(cors());

  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));

  app.use('/seat', seatRoutes);
  app.use('/mutex', mutexRoutes);
  app.use('/', electionRoutes);
  app.use('/node', nodeRoutes);
  app.use('/transaction', transactionRoutes);
  app.use('/system', systemRoutes);

  return app;
}

module.exports = { createApp };
