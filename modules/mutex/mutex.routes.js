const express = require('express');
const { acquireLock, releaseLock } = require('./mutex.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Mutex
 *   description: Mutex lock management for critical section access
 */

/**
 * @swagger
 * /mutex/acquire:
 *   post:
 *     summary: Acquire a mutex lock
 *     description: Request to acquire a mutex lock for critical section access (only available on leader node)
 *     tags: [Mutex]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               requesterId:
 *                 type: integer
 *                 description: ID of the node requesting the lock
 *                 example: 2
 *     responses:
 *       200:
 *         description: Lock granted successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "GRANTED"
 *       400:
 *         description: Request denied - node is not the leader
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Not Leader"
 */
router.post('/acquire', acquireLock);

/**
 * @swagger
 * /mutex/release:
 *   post:
 *     summary: Release a mutex lock
 *     description: Release a previously acquired mutex lock
 *     tags: [Mutex]
 *     responses:
 *       200:
 *         description: Lock released successfully
 */
router.post('/release', releaseLock);

module.exports = router;
