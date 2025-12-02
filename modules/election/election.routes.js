const express = require('express');
const {
  handlePing,
  handleElection,
  handleVictory
} = require('./election.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Election
 *   description: Election management endpoints for Bully Algorithm
 */

/**
 * @swagger
 * /election/ping:
 *   get:
 *     summary: Ping endpoint for leader election
 *     description: Used by other nodes to check if this node is alive during election process
 *     tags: [Election]
 *     responses:
 *       200:
 *         description: Node is alive
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "OK"
 */
router.get('/ping', handlePing);

/**
 * @swagger
 * /election/election:
 *   post:
 *     summary: Handle election request
 *     description: Process election request from another node with higher ID
 *     tags: [Election]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senderId:
 *                 type: integer
 *                 description: ID of the node that sent the election request
 *                 example: 2
 *     responses:
 *       200:
 *         description: Election request processed successfully
 */
router.post('/election', handleElection);

/**
 * @swagger
 * /election/victory:
 *   post:
 *     summary: Handle election victory
 *     description: Process election victory announcement from winning node
 *     tags: [Election]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leaderId:
 *                 type: integer
 *                 description: ID of the new leader node
 *                 example: 3
 *               candidates:
 *                 type: array
 *                 description: List of candidate nodes in the election
 *                 items:
 *                   type: integer
 *                   example: [1, 2, 3]
 *               reason:
 *                 type: string
 *                 description: Reason for the election victory
 *                 example: "Election completed successfully"
 *     responses:
 *       200:
 *         description: Election victory processed successfully
 */
router.post('/victory', handleVictory);

module.exports = router;