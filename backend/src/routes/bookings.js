import express from 'express';
import { createBooking, getBookings } from '../controllers/bookings.js';

const router = express.Router();

// GET /bookings - Get all bookings (with optional user_id filter)
router.get('/', getBookings);

// POST /bookings - Create a new booking
router.post('/', createBooking);

export default router;
