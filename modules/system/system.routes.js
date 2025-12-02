const express = require('express');
const { toggleSystem } = require('./system.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: System
 *   description: System control endpoints
 */

/**
 * @swagger
 * /system/toggle:
 *   post:
 *     summary: Toggle system active state
 *     description: Simulate toggling the system active/inactive state
 *     tags: [System]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               active:
 *                 type: boolean
 *                 description: Whether to set the system as active or inactive
 *                 example: true
 *     responses:
 *       200:
 *         description: System state toggled successfully
 *       500:
 *         description: Internal server error
 */
router.post('/toggle', toggleSystem);

module.exports = router;
