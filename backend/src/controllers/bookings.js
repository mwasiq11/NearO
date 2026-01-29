import { v4 as uuidv4 } from 'uuid';
import { pool, readPool } from '../db/database.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import { getIO } from '../realtime/socket.js';

const createBooking = async (req, res) => {
  try {
    const { service_id, seeker_id, requested_time } = req.body;

    // Validation
    if (!service_id || !seeker_id || !requested_time) {
      return res.status(400).json({ error: 'Service ID, seeker ID, and requested time are required' });
    }

    // Check if service exists and get provider_id
    const [services] = await pool.execute(
      'SELECT id, provider_id FROM services WHERE id = ?',
      [service_id]
    );

    if (services.length === 0) {
      return res.status(400).json({ error: 'Service does not exist' });
    }

    const service = services[0];

    // Check if seeker exists
    const [seekers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [seeker_id]
    );

    if (seekers.length === 0) {
      return res.status(400).json({ error: 'Seeker does not exist' });
    }

    // CRITICAL: Prevent self-booking (Stage 1 requirement)
    if (service.provider_id === seeker_id) {
      return res.status(400).json({ error: 'Users cannot book their own services' });
    }

    const id = uuidv4();

    // Insert booking
    await pool.execute(
      'INSERT INTO bookings (id, service_id, seeker_id, requested_time) VALUES (?, ?, ?, ?)',
      [id, service_id, seeker_id, requested_time]
    );

    // Create notification for provider about new booking
    try {
      const notificationId = uuidv4();
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES (?, ?, 'booking_new', 'New Booking Request', 'You have a new service booking request', 'booking', ?)`,
        [notificationId, service.provider_id, id]
      );
      console.log(`✅ Notification created for provider about new booking`);

      // Emit real-time notification to provider via Socket.io
      const io = getIO();
      if (io) {
        io.emit('booking:new', {
          bookingId: id,
          service_id,
          seeker_id,
          requested_time
        });
      }
    } catch (notifError) {
      console.error('Warning: Failed to create notification:', notifError);
    }

    // Auto-create conversation for messaging
    try {
      const [existingConv] = await pool.execute(
        `SELECT id FROM conversations WHERE seeker_id = ? AND provider_id = ? AND service_id = ?`,
        [seeker_id, service.provider_id, service_id]
      );
      
      if (existingConv.length === 0) {
        const conversationId = uuidv4();
        await pool.execute(
          `INSERT INTO conversations (id, seeker_id, provider_id, service_id, last_message_at)
           VALUES (?, ?, ?, ?, NOW())`,
          [conversationId, seeker_id, service.provider_id, service_id]
        );
        console.log(`✅ Created conversation ${conversationId} for booking ${id}`);
      }
    } catch (convError) {
      console.error('Warning: Failed to create conversation:', convError);
      // Don't fail the booking if conversation creation fails
    }

    res.status(201).json({
      id,
      service_id,
      seeker_id,
      requested_time,
      status: 'pending'
    });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: seeker_id,
      actionType: 'booking_create',
      entityType: 'booking',
      entityId: id,
      newValue: {
        service_id,
        seeker_id,
        requested_time,
        status: 'pending'
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT b.*, s.title as service_title, s.category, s.provider_id, u.name as seeker_name
      FROM bookings b
      JOIN services s ON b.service_id = s.id
      JOIN users u ON b.seeker_id = u.id
      ORDER BY b.created_at DESC
    `;
    let params = [];

    if (user_id) {
      query = `
        SELECT b.*, s.title as service_title, s.category, s.provider_id, u.name as seeker_name
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN users u ON b.seeker_id = u.id
        WHERE b.seeker_id = ? OR s.provider_id = ?
        ORDER BY b.created_at DESC
      `;
      params = [user_id, user_id];
    }

    const [bookings] = await readPool.execute(query, params);
    res.json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ error: error.message });
  }
};

const acceptBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Verify the user is the provider
    const [bookings] = await pool.execute(
      `SELECT b.*, s.provider_id FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    console.log(`[ACCEPT] Provider ID: ${booking.provider_id}, Current User: ${userId}`);

    if (booking.provider_id !== userId) {
      return res.status(403).json({ error: 'Only the service provider can accept bookings' });
    }

    // Update booking status
    await pool.execute(
      `UPDATE bookings SET status = 'approved' WHERE id = ?`,
      [id]
    );
    console.log(`✅ Booking ${id} updated to approved`);

    // Create notification for seeker
    const notificationId = uuidv4();
    try {
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES (?, ?, 'booking_accepted', 'Booking Accepted', 'Your booking has been accepted by the provider', 'booking', ?)`,
        [notificationId, booking.seeker_id, id]
      );
      console.log(`✅ Notification ${notificationId} created for seeker ${booking.seeker_id}`);

      // Emit real-time notification to seeker via Socket.io
      const io = getIO();
      if (io) {
        io.emit('booking:status-changed', {
          bookingId: id,
          status: 'approved',
          seekerId: booking.seeker_id,
          notification: {
            id: notificationId,
            type: 'booking_accepted',
            title: 'Booking Accepted',
            message: 'Your booking has been accepted by the provider'
          }
        });
        console.log(`📡 Socket.io event emitted for booking status change`);
      }
    } catch (notifError) {
      console.error('Warning: Failed to create notification:', notifError);
    }

    res.json({ success: true, message: 'Booking accepted' });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: userId,
      actionType: 'booking_accept',
      entityType: 'booking',
      entityId: id,
      newValue: { status: 'approved' },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ error: error.message });
  }
};

const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    // Verify the user is the provider
    const [bookings] = await pool.execute(
      `SELECT b.*, s.provider_id FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = ?`,
      [id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    console.log(`[REJECT] Provider ID: ${booking.provider_id}, Current User: ${userId}`);

    if (booking.provider_id !== userId) {
      return res.status(403).json({ error: 'Only the service provider can reject bookings' });
    }

    // Update booking status
    await pool.execute(
      `UPDATE bookings SET status = 'rejected' WHERE id = ?`,
      [id]
    );
    console.log(`✅ Booking ${id} updated to rejected`);

    // Create notification for seeker
    const notificationId = uuidv4();
    try {
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES (?, ?, 'booking_rejected', 'Booking Declined', 'Your booking has been declined by the provider', 'booking', ?)`,
        [notificationId, booking.seeker_id, id]
      );
      console.log(`✅ Notification ${notificationId} created for seeker ${booking.seeker_id}`);

      // Emit real-time notification to seeker via Socket.io
      const io = getIO();
      if (io) {
        io.emit('booking:status-changed', {
          bookingId: id,
          status: 'rejected',
          seekerId: booking.seeker_id,
          notification: {
            id: notificationId,
            type: 'booking_rejected',
            title: 'Booking Declined',
            message: 'Your booking has been declined by the provider'
          }
        });
        console.log(`📡 Socket.io event emitted for booking status change`);
      }
    } catch (notifError) {
      console.error('Warning: Failed to create notification:', notifError);
    }

    res.json({ success: true, message: 'Booking rejected' });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: userId,
      actionType: 'booking_reject',
      entityType: 'booking',
      entityId: id,
      newValue: { status: 'rejected' },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createBooking,
  getBookings,
  acceptBooking,
  rejectBooking
};