import { v4 as uuidv4 } from 'uuid';
import { pool, readPool } from '../db/database.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';

const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    const [bookings] = await pool.execute(
      `SELECT b.id, b.seeker_id, b.status, s.id as service_id, s.provider_id
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE b.id = ?`,
      [booking_id]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookings[0];
    if (booking.seeker_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only review your own bookings' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved bookings can be reviewed' });
    }

    const reviewId = uuidv4();
    await pool.execute(
      `INSERT INTO reviews (id, provider_id, reviewer_id, service_id, booking_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [reviewId, booking.provider_id, req.user.id, booking.service_id, booking.id, rating, comment || null]
    );

    // Create notification for provider about new review
    try {
      const notificationId = uuidv4();
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id)
         VALUES (?, ?, 'review_posted', 'New Review', 'You received a new review from a customer', 'review', ?)`,
        [notificationId, booking.provider_id, reviewId]
      );
      console.log(`✅ Notification created for provider about review`);
    } catch (notifError) {
      console.error('Warning: Failed to create notification:', notifError);
    }

    res.status(201).json({
      id: reviewId,
      provider_id: booking.provider_id,
      reviewer_id: req.user.id,
      service_id: booking.service_id,
      booking_id: booking.id,
      rating,
      comment: comment || null
    });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: req.user.id,
      actionType: 'review_create',
      entityType: 'review',
      entityId: reviewId,
      newValue: { rating, comment },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: error.message });
  }
};

const listProviderReviews = async (req, res) => {
  try {
    const { providerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [reviews] = await readPool.execute(
      `SELECT r.*, u.name as reviewer_name
       FROM reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.provider_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [providerId, parseInt(limit), offset]
    );

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        count: reviews.length
      }
    });
  } catch (error) {
    console.error('Error listing reviews:', error);
    res.status(500).json({ error: error.message });
  }
};

const getReputation = async (req, res) => {
  try {
    const { providerId } = req.params;

    const [ratings] = await readPool.execute(
      'SELECT rating FROM reviews WHERE provider_id = ?',
      [providerId]
    );
    const [avgRow] = await readPool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE provider_id = ?',
      [providerId]
    );

    const [bookingStats] = await readPool.execute(
      `SELECT 
         SUM(b.status = 'approved') as approved_count,
         COUNT(*) as total_count
       FROM bookings b
       JOIN services s ON b.service_id = s.id
       WHERE s.provider_id = ?`,
      [providerId]
    );

    const avgRating = avgRow[0].avg_rating ? parseFloat(avgRow[0].avg_rating) : 0;
    const ratingCount = avgRow[0].count || 0;
    const approvedCount = bookingStats[0].approved_count || 0;
    const totalCount = bookingStats[0].total_count || 0;
    const completionRate = totalCount > 0 ? approvedCount / totalCount : 0;

    let variance = 0;
    if (ratings.length > 1) {
      const mean = avgRating;
      variance = ratings.reduce((acc, r) => acc + Math.pow(r.rating - mean, 2), 0) / ratings.length;
    }
    const stddev = Math.sqrt(variance);
    const consistencyBonus = Math.max(0, 1 - stddev / 2);

    const score = (avgRating * 0.6) + (completionRate * 5 * 0.3) + (consistencyBonus * 0.1 * 5);

    res.json({
      provider_id: providerId,
      average_rating: avgRating,
      rating_count: ratingCount,
      completion_rate: completionRate,
      consistency_bonus: consistencyBonus,
      reputation_score: parseFloat(score.toFixed(2))
    });
  } catch (error) {
    console.error('Error calculating reputation:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createReview,
  listProviderReviews,
  getReputation
};

