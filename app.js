const express = require('express');
const bodyParser = require('body-parser');

const ticketRoutes = require('./routes/ticketRoutes');
const mutexRoutes = require('./routes/mutexRoutes');
const bullyRoutes = require('./routes/bullyRoutes');

function createApp() {
  const app = express();

  app.use(bodyParser.json());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app.use(ticketRoutes);
  app.use(mutexRoutes);
  app.use(bullyRoutes);

  return app;
}

module.exports = { createApp };
