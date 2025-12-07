const express = require('express');
const { getNodes } = require('./node.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Node
 *   description: Node management endpoints for cluster monitoring
 */

/**
 * @swagger
 * /node:
 *   get:
 *     summary: Get all nodes
 *     description: Retrieve information about all nodes in the cluster including their status and leadership
 *     tags: [Node]
 *     responses:
 *       200:
 *         description: List of all nodes in the cluster
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
 *                   isLeader:
 *                     type: boolean
 *                     example: false
 *                   last_heartbeat:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-27T10:00:00.000Z"
 */
router.get('/', getNodes);

module.exports = router;
