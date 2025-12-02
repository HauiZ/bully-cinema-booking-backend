const express = require('express');
const { getTransactions, getElectionHistory } = require('./transaction.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Transaction
 *   description: Transaction and election history tracking
 */

/**
 * @swagger
 * /transaction:
 *   get:
 *     summary: Get transaction logs
 *     description: Retrieve transaction logs for monitoring system activities
 *     tags: [Transaction]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of transactions to return
 *     responses:
 *       200:
 *         description: List of transaction logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   node_id:
 *                     type: integer
 *                     example: 1
 *                   action_type:
 *                     type: string
 *                     enum: [BUY, RELEASE, ELECTION, KILL, REVIVE]
 *                     example: "BUY"
 *                   description:
 *                     type: string
 *                     example: "Seat A1 booked by John Doe"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-27T10:00:00.000Z"
 */
router.get('/', getTransactions);

/**
 * @swagger
 * /transaction/history:
 *   get:
 *     summary: Get election history
 *     description: Retrieve historical election records
 *     tags: [Transaction]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of election records to return
 *     responses:
 *       200:
 *         description: List of election history records
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   old_leader_id:
 *                     type: integer
 *                     example: 1
 *                   new_leader_id:
 *                     type: integer
 *                     example: 3
 *                   candidates:
 *                     type: string
 *                     example: "[1,2,3]"
 *                   reason:
 *                     type: string
 *                     example: "Leader node died"
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-27T10:00:00.000Z"
 */
router.get('/history', getElectionHistory);

module.exports = router;
