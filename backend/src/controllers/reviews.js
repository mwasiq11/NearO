import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';

const createReview = async (req, res) => {
  try {
    const { booking_id, rating, comment } = req.body;

    const booking = await prisma.bookings.findUnique({
      where: { id: booking_id },
      include: {
        services: {
          select: { id: true, provider_id: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.seeker_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only review your own bookings' });
    }

    if (booking.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved bookings can be reviewed' });
    }

    const reviewId = uuidv4();
    const review = await prisma.reviews.create({
      data: {
        id: reviewId,
        provider_id: booking.services.provider_id,
        reviewer_id: req.user.id,
        service_id: booking.service_id,
        booking_id: booking.id,
        rating,
        comment: comment || null
      }
    });

    // Create notification for provider about new review
    try {
      await prisma.notifications.create({
        data: {
          id: uuidv4(),
          user_id: booking.services.provider_id,
          type: 'review_posted',
          title: 'New Review',
          message: 'You received a new review from a customer',
          entity_type: 'review',
          entity_id: reviewId
        }
      });
      console.log(`✅ Notification created for provider about review`);
    } catch (notifError) {
      console.error('Warning: Failed to create notification:', notifError);
    }

    res.status(201).json(review);

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
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;

    const reviews = await prisma.reviews.findMany({
      where: { provider_id: providerId },
      include: {
        users_reviews_reviewer_idTousers: { select: { name: true } }
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum
    });

    const mappedReviews = reviews.map(r => ({
      ...r,
      reviewer_name: r.users_reviews_reviewer_idTousers.name
    }));

    res.json({
      reviews: mappedReviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
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

    const reviews = await prisma.reviews.findMany({
      where: { provider_id: providerId },
      select: { rating: true }
    });

    const stats = await prisma.reviews.aggregate({
      where: { provider_id: providerId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    const bookingStats = await prisma.bookings.groupBy({
      by: ['status'],
      where: {
        services: { provider_id: providerId }
      },
      _count: { _all: true }
    });

    const avgRating = stats._avg.rating || 0;
    const ratingCount = stats._count._all || 0;
    const approvedCount = bookingStats.find(s => s.status === 'approved')?._count._all || 0;
    const totalCount = bookingStats.reduce((acc, s) => acc + s._count._all, 0);
    const completionRate = totalCount > 0 ? approvedCount / totalCount : 0;

    let variance = 0;
    if (reviews.length > 1) {
      const mean = avgRating;
      variance = reviews.reduce((acc, r) => acc + Math.pow(r.rating - mean, 2), 0) / reviews.length;
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

