import express from 'express';
import { createBooking, getBookings, getBookingById, acceptBooking, rejectBooking } from '../controllers/bookings.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /bookings - Get all bookings (with optional user_id filter)
router.get('/', getBookings);

// GET /bookings/:id - Get a single booking by ID
router.get('/:id', getBookingById);

// POST /bookings - Create a new booking
router.post('/', createBooking);

// PUT /bookings/:id/accept - Accept a booking
router.put('/:id/accept', authenticate, acceptBooking);

// PUT /bookings/:id/reject - Reject a booking
router.put('/:id/reject', authenticate, rejectBooking);

export default router;
