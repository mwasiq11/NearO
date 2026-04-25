import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import { publishNotification } from '../services/eventService.js';

/**
 * Recalculates the average rating and total reviews for a service
 * @param {string} serviceId 
 */
async function updateServiceRating(serviceId) {
  try {
    const stats = await prisma.reviews.aggregate({
      where: { service_id: serviceId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    await prisma.services.update({
      where: { id: serviceId },
      data: {
        average_rating: stats._avg.rating || 0,
        total_reviews: stats._count._all || 0
      }
    });
    
    console.log(`✅ Updated rating for service ${serviceId}: ${stats._avg.rating || 0} (${stats._count._all} reviews)`);
  } catch (error) {
    console.error(`Error updating service rating for ${serviceId}:`, error);
  }
}

const createReview = async (req, res) => {
  try {
    console.log('📥 Incoming review request:', JSON.stringify(req.body));
    const { booking_id, service_id, rating, comment } = req.body;
    const reviewer_id = req.user.id;

    if (!service_id || !rating) {
        return res.status(400).json({ error: 'service_id and rating are required' });
    }

    // 1. Verify service exists
    const service = await prisma.services.findUnique({
      where: { id: service_id },
      select: { id: true, provider_id: true }
    });

    if (!service) {
      console.log('❌ Service not found:', service_id);
      return res.status(404).json({ error: 'Service not found' });
    }

    // 2. Check if a review already exists for this user and service (Create or Update)
    const existingReview = await prisma.reviews.findFirst({
      where: {
        reviewer_id: reviewer_id,
        service_id: service_id
      }
    });

    let review;
    let reviewId;

    if (existingReview) {
      console.log('🔄 Updating existing review:', existingReview.id);
      reviewId = existingReview.id;
      review = await prisma.reviews.update({
        where: { id: reviewId },
        data: {
          rating,
          comment: comment !== undefined ? comment : existingReview.comment,
          booking_id: booking_id || existingReview.booking_id
        }
      });
    } else {
      console.log('🆕 Creating new review');
      reviewId = uuidv4();
      
      // Use raw ID fields (unchecked data) to avoid relation-level validation issues
      review = await prisma.reviews.create({
        data: {
          id: reviewId,
          rating,
          comment: comment || null,
          provider_id: service.provider_id,
          reviewer_id: reviewer_id,
          service_id: service_id,
          booking_id: booking_id || null
        }
      });
    }

    console.log('✅ Review processed successfully:', review.id);

    // 3. Recalculate Service Rating (Asynchronous)
    updateServiceRating(service_id).catch(err => console.error('Rating update failed:', err));

    // 4. Create notification for provider
    try {
      await publishNotification(service.provider_id, 'review', {
        reviewId: reviewId,
        serviceId: service_id,
        isUpdate: !!existingReview,
        rating
      });
    } catch (notifError) {
      console.error('Warning: Failed to publish notification:', notifError);
    }

    // 5. Audit log (Safe)
    try {
        const ctx = buildRequestContext(req);
        await logAudit({
          actorId: reviewer_id,
          actionType: existingReview ? 'review_update' : 'review_create',
          entityType: 'review',
          entityId: reviewId,
          newValue: { rating, comment },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent
        });
    } catch (auditError) {
        console.error('Warning: Audit log failed:', auditError);
    }

    return res.status(existingReview ? 200 : 201).json(review);

  } catch (error) {
    console.error('🔥 Error in createReview controller:', error);
    return res.status(500).json({ 
        error: error.message, 
        message: 'An internal server error occurred while processing the review.',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
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
        users_reviews_reviewer_idTousers: { select: { name: true, profile_picture: true } }
      },
      orderBy: { created_at: 'desc' },
      skip: offset,
      take: limitNum
    });

    const mappedReviews = reviews.map(r => ({
      ...r,
      reviewer_name: r.users_reviews_reviewer_idTousers.name,
      reviewer_avatar: r.users_reviews_reviewer_idTousers.profile_picture
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

    const stats = await prisma.reviews.aggregate({
      where: { provider_id: providerId },
      _avg: { rating: true },
      _count: { _all: true }
    });

    res.json({
      provider_id: providerId,
      average_rating: stats._avg.rating || 0,
      total_reviews: stats._count._all || 0
    });
  } catch (error) {
    console.error('Error getting reputation:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createReview,
  listProviderReviews,
  getReputation
};
