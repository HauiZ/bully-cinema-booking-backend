const express = require('express');
const { getNodes, killNode, reviveNode } = require('./node.controller');

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
 *                   isAlive:
 *                     type: boolean
 *                     example: true
 *                   isLeader:
 *                     type: boolean
 *                     example: false
 *                   last_heartbeat:
 *                     type: string
 *                     format: date-time
 *                     example: "2023-10-27T10:00:00.000Z"
 */
router.get('/', getNodes);

/**
 * @swagger
 * /node/{id}/kill:
 *   post:
 *     summary: Kill a specific node
 *     description: Simulate killing a node in the cluster for testing purposes
 *     tags: [Node]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID to kill
 *     responses:
 *       200:
 *         description: Node killed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Node 1 was killed."
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/kill', killNode);

/**
 * @swagger
 * /node/{id}/revive:
 *   post:
 *     summary: Revive a specific node
 *     description: Revive a previously killed node in the cluster
 *     tags: [Node]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Node ID to revive
 *     responses:
 *       200:
 *         description: Node revived successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Node 1 was revived."
 *       404:
 *         description: Node not found
 *       500:
 *         description: Internal server error
 */
router.post('/:id/revive', reviveNode);

module.exports = router;
