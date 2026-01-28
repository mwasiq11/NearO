import express from 'express';
import { createBooking, getBookings, acceptBooking, rejectBooking } from '../controllers/bookings.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /bookings - Get all bookings (with optional user_id filter)
router.get('/', getBookings);

// POST /bookings - Create a new booking
router.post('/', createBooking);

// PUT /bookings/:id/accept - Accept a booking
router.put('/:id/accept', authenticate, acceptBooking);

// PUT /bookings/:id/reject - Reject a booking
router.put('/:id/reject', authenticate, rejectBooking);

export default router;
