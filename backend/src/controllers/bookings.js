import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import { getIO } from '../realtime/socket.js';
import { publishNotification } from '../services/eventService.js';

const createBooking = async (req, res) => {
  try {
    const { service_id, seeker_id, requested_time } = req.body;

    // Validation
    if (!service_id || !seeker_id || !requested_time) {
      return res.status(400).json({ error: 'Service ID, seeker ID, and requested time are required' });
    }

    // Check if service exists and get provider_id
    const service = await prisma.services.findUnique({
      where: { id: service_id },
      select: { id: true, provider_id: true }
    });

    if (!service) {
      return res.status(400).json({ error: 'Service does not exist' });
    }

    // Check if seeker exists
    const seeker = await prisma.users.findUnique({
      where: { id: seeker_id },
      select: { id: true }
    });

    if (!seeker) {
      return res.status(400).json({ error: 'Seeker does not exist' });
    }

    // CRITICAL: Prevent self-booking
    if (service.provider_id === seeker_id) {
      return res.status(400).json({ error: 'Users cannot book their own services' });
    }

    const id = uuidv4();

    // Insert booking
    const booking = await prisma.bookings.create({
      data: {
        id,
        service_id,
        seeker_id,
        requested_time: String(requested_time),
        status: 'pending'
      }
    });

    // Create notification for provider about new booking
    try {
      await publishNotification(service.provider_id, 'booking_request', {
        bookingId: id,
        serviceName: service.title,
        seekerId: seeker_id
      });
      console.log(`✅ Notification published for provider about new booking`);
    } catch (notifError) {
      console.error('Warning: Failed to publish notification:', notifError);
    }

    // Auto-create conversation for messaging
    try {
      const existingConv = await prisma.conversations.findFirst({
        where: {
          seeker_id,
          provider_id: service.provider_id,
          service_id
        }
      });
      
      if (!existingConv) {
        const conversationId = uuidv4();
        await prisma.conversations.create({
          data: {
            id: conversationId,
            seeker_id,
            provider_id: service.provider_id,
            service_id,
            last_message_at: new Date()
          }
        });
        console.log(`✅ Created conversation ${conversationId} for booking ${id}`);
      }
    } catch (convError) {
      console.error('Warning: Failed to create conversation:', convError);
    }

    res.status(201).json(booking);

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
    
    const where = {};
    if (user_id) {
      where.OR = [
        { seeker_id: user_id },
        { services: { provider_id: user_id } }
      ];
    }

    const bookings = await prisma.bookings.findMany({
      where,
      include: {
        services: {
          select: {
            title: true,
            category: true,
            image_url: true,
            provider_id: true,
            currency: true
          }
        },
        users: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    const mappedBookings = bookings.map(b => ({
      ...b,
      service_title: b.services.title,
      category: b.services.category,
      service_image_url: b.services.image_url,
      provider_id: b.services.provider_id,
      currency: b.services.currency,
      seeker_name: b.users?.name
    }));

    res.json(mappedBookings);
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
    const booking = await prisma.bookings.findUnique({
      where: { id },
      include: {
        services: { select: { provider_id: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.services.provider_id !== userId) {
      return res.status(403).json({ error: 'Only the service provider can accept bookings' });
    }

    // Update booking status
    await prisma.bookings.update({
      where: { id },
      data: { status: 'approved' }
    });

    // Create notification for seeker
    try {
      await publishNotification(booking.seeker_id, 'booking_approved', {
        bookingId: id,
        providerId: userId
      });
      console.log(`✅ Notification published for seeker about booking approved`);
    } catch (notifError) {
      console.error('Warning: Failed to publish notification:', notifError);
    }

    // Emit real-time booking status update for dashboards and booking views
    const io = getIO();
    if (io) {
      io.emit('booking:status-changed', {
        bookingId: id,
        status: 'approved',
        seekerId: booking.seeker_id,
        providerId: userId,
      });
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
    const booking = await prisma.bookings.findUnique({
      where: { id },
      include: {
        services: { select: { provider_id: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.services.provider_id !== userId) {
      return res.status(403).json({ error: 'Only the service provider can reject bookings' });
    }

    // Update booking status
    await prisma.bookings.update({
      where: { id },
      data: { status: 'rejected' }
    });

    // Create notification for seeker
    const notificationId = uuidv4();
    try {
      await prisma.notifications.create({
        data: {
          id: notificationId,
          user_id: booking.seeker_id,
          type: 'booking_rejected',
          payload: {
            title: 'Booking Declined',
            message: 'Your booking has been declined by the provider',
            entity_type: 'booking',
            entity_id: id
          }
        }
      });

      // Emit real-time notification to seeker via Socket.io
      const io = getIO();
      if (io) {
        io.emit('booking:status-changed', {
          bookingId: id,
          status: 'rejected',
          seekerId: booking.seeker_id,
          providerId: booking.services.provider_id,
          notification: {
            id: notificationId,
            type: 'booking_rejected',
            title: 'Booking Declined',
            message: 'Your booking has been declined by the provider'
          }
        });
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