import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { normalizeLocation, calculateDistance, isValidLatLng } from '../utils/location.js';
import { invalidateCache } from '../cache/cache.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';
import { getFileUrl } from '../middleware/upload.js';
import { getIO } from '../realtime/socket.js';

const createService = async (req, res) => {
  try {
    const { 
      provider_id, 
      title, 
      description, 
      category, 
      price, 
      availability,
      latitude,
      longitude,
      neighborhood,
      city,
      image_url,
      currency
    } = req.body;

    // Validation
    if (!provider_id || !title || !description || !category || price === undefined || !availability) {
      return res.status(400).json({ error: 'All required fields are missing' });
    }

    if (price < 0) {
      return res.status(400).json({ error: 'Price must be non-negative' });
    }

    // Check if provider exists
    const provider = await prisma.users.findUnique({
      where: { id: provider_id },
      select: { id: true }
    });

    if (!provider) {
      return res.status(400).json({ error: 'Provider does not exist' });
    }

    // Auto-add custom category if it doesn't exist
    try {
      const existingCategory = await prisma.service_categories.findUnique({
        where: { name: category }
      });

      if (!existingCategory) {
        // Add the new custom category
        await prisma.service_categories.create({
          data: {
            id: uuidv4(),
            name: category,
            description: `Custom category: ${category}`,
            is_active: true
          }
        });
        console.log(`✨ New custom category added: ${category}`);
      }
    } catch (categoryError) {
      console.error('Error checking/adding category:', categoryError);
    }

    const id = uuidv4();

    // Normalize location data if provided
    let locationData = null;
    if (latitude && longitude) {
      locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
    } else if (neighborhood || city) {
      // Save neighborhood and city even without coordinates
      locationData = {
        latitude: null,
        longitude: null,
        s2_cell_id: null,
        neighborhood: neighborhood || null,
        city: city || null
      };
    }

    // Insert service with location data
    const serviceData = {
      id,
      provider_id,
      title,
      description,
      category,
      price: parseFloat(price),
      currency: currency || 'PKR',
      availability,
      image_url: image_url || null
    };

    if (locationData) {
      Object.assign(serviceData, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        s2_cell_id: locationData.s2_cell_id ? BigInt(locationData.s2_cell_id.toString()) : null,
        neighborhood: locationData.neighborhood,
        city: locationData.city
      });
    }

    const newService = await prisma.services.create({
      data: serviceData
    });

    console.log('✅ Service created:', {
      id: newService.id,
      title: newService.title,
      neighborhood: newService.neighborhood,
      city: newService.city
    });

    res.status(201).json(newService);

    // Notify moderators/admins
    getIO()?.to('moderation').emit('service:new', {
      serviceId: id,
      title: newService.title,
      providerId: newService.provider_id
    });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: req.user?.id || null,
      actionType: 'service_create',
      entityType: 'service',
      entityId: id,
      newValue: newService[0],
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    try {
      await invalidateCache('cache:categories:active');
      await invalidateCache('cache:cities:all');
      await invalidateCache('cache:neighborhoods:all');
      if (newService[0]?.city) {
        await invalidateCache(`cache:neighborhoods:${newService[0].city}`);
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ error: error.message });
  }
};

const getServices = async (req, res) => {
  try {
    const { category, latitude, longitude } = req.query;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radiusKm = 25; // Mandatory 25km radius

    let services = await prisma.services.findMany({
      where: {
        is_active: true,
        ...(category ? { category } : {})
      },
      orderBy: { created_at: 'desc' }
    });

    // If user provides location, filter by 25km radius
    if (isValidLatLng(lat, lng)) {
      services = services.filter(service => {
        if (!service.latitude || !service.longitude) return false;
        
        const distance = calculateDistance(
          lat,
          lng,
          parseFloat(service.latitude),
          parseFloat(service.longitude)
        );
        service.distance = distance;
        return distance <= radiusKm;
      });
      // Sort by distance if location provided
      services.sort((a, b) => a.distance - b.distance);
    }

    res.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: error.message });
  }
};

const getMyServices = async (req, res) => {
  try {
    const services = await prisma.services.findMany({
      where: { provider_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });
    res.json(services);
  } catch (error) {
    console.error('Error getting my services:', error);
    res.status(500).json({ error: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await prisma.services.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateServiceOwn = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      price,
      availability,
      latitude,
      longitude,
      neighborhood,
      city,
      image_url,
      currency
    } = req.body;

    const service = await prisma.services.findUnique({
      where: { id }
    });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Auto-add custom category if it doesn't exist and category is being updated
    if (category !== undefined) {
      try {
        const existingCategory = await prisma.service_categories.findUnique({
          where: { name: category }
        });

        if (!existingCategory) {
          await prisma.service_categories.create({
            data: {
              id: uuidv4(),
              name: category,
              description: `Custom category: ${category}`,
              is_active: true
            }
          });
          console.log(`✨ New custom category added: ${category}`);
        }
      } catch (categoryError) {
        console.error('Error checking/adding category:', categoryError);
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (currency !== undefined) updateData.currency = currency;
    if (availability !== undefined) updateData.availability = availability;
    if (image_url !== undefined) updateData.image_url = image_url;

    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Both latitude and longitude are required for location updates' });
      }
      const locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
      if (!locationData) {
        return res.status(400).json({ error: 'Invalid location data' });
      }
      Object.assign(updateData, {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        s2_cell_id: locationData.s2_cell_id ? BigInt(locationData.s2_cell_id.toString()) : null,
        neighborhood: locationData.neighborhood,
        city: locationData.city
      });
    } else {
      if (neighborhood !== undefined) updateData.neighborhood = neighborhood;
      if (city !== undefined) updateData.city = city;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await prisma.services.update({
      where: { id },
      data: updateData
    });
    res.json(updated);

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: req.user?.id || null,
      actionType: 'service_update_own',
      entityType: 'service',
      entityId: id,
      newValue: updated[0],
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    try {
      await invalidateCache('cache:categories:active');
      await invalidateCache('cache:cities:all');
      await invalidateCache('cache:neighborhoods:all');
      if (updated[0]?.city) {
        await invalidateCache(`cache:neighborhoods:${updated[0].city}`);
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteServiceOwn = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.services.findUnique({
      where: { id },
      select: { city: true }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.services.delete({
      where: { id }
    });
    res.json({ message: 'Service deleted successfully' });

    const ctx = buildRequestContext(req);
    await logAudit({
      actorId: req.user?.id || null,
      actionType: 'service_delete_own',
      entityType: 'service',
      entityId: id,
      oldValue: existing[0] || null,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent
    });

    try {
      await invalidateCache('cache:categories:active');
      await invalidateCache('cache:cities:all');
      await invalidateCache('cache:neighborhoods:all');
      if (existing[0]?.city) {
        await invalidateCache(`cache:neighborhoods:${existing[0].city}`);
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: error.message });
  }
};

// Report a service
const reportService = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    // Check if service exists
    const service = await prisma.services.findUnique({
      where: { id },
      select: { provider_id: true }
    });
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await prisma.user_reports.create({
      data: {
        id: uuidv4(),
        reported_user_id: service.provider_id,
        reported_by: req.user.id,
        service_id: id,
        reason
      }
    });

    res.status(201).json({ message: 'Service reported successfully' });

    // Notify moderators/admins
    getIO()?.to('moderation').emit('report:new', {
      serviceId: id,
      reason
    });
  } catch (error) {
    console.error('Error reporting service:', error);
    res.status(500).json({ error: error.message });
  }
};

const uploadServiceImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    const imageUrl = getFileUrl(req.file.filename, 'service_image');

    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error('Error uploading service image:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createService,
  getServices,
  getServiceById,
  updateServiceOwn,
  deleteServiceOwn,
  reportService,
  uploadServiceImage,
  getMyServices
};
