const express = require('express');
const { getSeats, bookSeat, releaseSeat } = require('./seat.controller');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Seat
 *   description: Seat booking and management endpoints
 */

/**
 * @swagger
 * /seat:
 *   get:
 *     summary: Get all seats
 *     description: "Retrieve information about all seats in the cinema including their booking status (actual endpoint: /seats/seats)"
 *     tags: [Seat]
 *     responses:
 *       200:
 *         description: List of all seats
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
 *                   seat_number:
 *                     type: string
 *                     example: "A1"
 *                   status:
 *                     type: string
 *                     enum: [AVAILABLE, BOOKED]
 *                     example: "AVAILABLE"
 *                   customer_name:
 *                     type: string
 *                     example: "John Doe"
 *                   booked_by_node_id:
 *                     type: integer
 *                     example: 1
 */
router.get('/', getSeats);

/**
 * @swagger
 * /seat/book:
 *   post:
 *     summary: Book a seat
 *     description: "Book a specific seat in the cinema (actual endpoint: /seats/seats/book)"
 *     tags: [Seat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seatId:
 *                 type: string
 *                 description: "Seat number to book (e.g., \"A1\", \"B2\")"
 *                 example: "A1"
 *               customerName:
 *                 type: string
 *                 description: Name of the customer booking the seat
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Seat booked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Seat A1 booked successfully for John Doe"
 *       409:
 *         description: Seat not available or does not exist
 *       500:
 *         description: Internal server error
 */
router.post('/book', bookSeat);

/**
 * @swagger
 * /seat/release:
 *   post:
 *     summary: Release a seat
 *     description: "Release a previously booked seat, making it available again (actual endpoint: /seats/seats/release)"
 *     tags: [Seat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               seatId:
 *                 type: string
 *                 description: Seat number to release
 *                 example: "A1"
 *     responses:
 *       200:
 *         description: Seat released successfully
 *       404:
 *         description: Seat not found
 *       500:
 *         description: Internal server error
 */
router.post('/release', releaseSeat);

module.exports = router;
