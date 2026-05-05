import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { normalizeLocation, calculateDistance, isValidLatLng } from '../utils/location.js';
import { invalidateCache } from '../cache/cache.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';

import { getIO } from '../realtime/socket.js';

const enrichServicesWithBookingStats = async (services) => {
  if (!services || services.length === 0) {
    return [];
  }

  const serviceIds = services.map((service) => service.id);
  const grouped = await prisma.bookings.groupBy({
    by: ['service_id', 'status'],
    where: {
      service_id: { in: serviceIds },
    },
    _count: {
      _all: true,
    },
  });

  const statMap = new Map();
  for (const row of grouped) {
    const current = statMap.get(row.service_id) || { sold: 0, pending: 0 };
    if (row.status === 'approved') {
      current.sold += row._count._all;
    }
    if (row.status === 'pending') {
      current.pending += row._count._all;
    }
    statMap.set(row.service_id, current);
  }

  return services.map((service) => {
    const stats = statMap.get(service.id) || { sold: 0, pending: 0 };
    return {
      ...service,
      booking_count: stats.sold + stats.pending,
      sold_count: stats.sold,
      pending_count: stats.pending,
    };
  });
};

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
    let requestLat = lat;
    let requestLng = lng;

    if (!isValidLatLng(requestLat, requestLng) && req.user?.latitude && req.user?.longitude) {
      requestLat = parseFloat(req.user.latitude);
      requestLng = parseFloat(req.user.longitude);
    }

    // ─── PRIORITY: GPS > Profile Neighborhood > Profile City ───
    const hasValidCoords = isValidLatLng(requestLat, requestLng);
    const hasProfileNeighborhood = !!req.user?.neighborhood;
    const hasProfileCity = !!req.user?.city;

    if (!hasValidCoords && !hasProfileNeighborhood && !hasProfileCity) {
      return res.json([]);
    }

    // Build location-aware query
    let locationFilter = {};
    if (!hasValidCoords) {
      if (hasProfileNeighborhood) {
        // ▶ PRIORITY 2: Neighborhood — show services in neighborhood + broader city
        const orConditions = [
          { neighborhood: { contains: req.user.neighborhood } }
        ];
        if (hasProfileCity) {
          orConditions.push({ city: { contains: req.user.city } });
        }
        locationFilter = { OR: orConditions };
      } else if (hasProfileCity) {
        // ▶ PRIORITY 3: City — show all city services
        locationFilter = {
          OR: [
            { city: { contains: req.user.city } },
            { neighborhood: { contains: req.user.city } }
          ]
        };
      }
    }

    let services = await prisma.services.findMany({
      where: {
        is_active: true,
        ...(category ? { category } : {}),
        ...locationFilter
      },
      orderBy: { created_at: 'desc' }
    });

    services = await enrichServicesWithBookingStats(services);

    // ▶ PRIORITY 1: GPS — filter by 25km radius (HIGHEST PRIORITY)
    if (hasValidCoords) {
      services = services.filter(service => {
        if (!service.latitude || !service.longitude) return false;
        const distance = calculateDistance(
          requestLat,
          requestLng,
          parseFloat(service.latitude),
          parseFloat(service.longitude)
        );
        service.distance = distance;
        return distance <= radiusKm;
      });
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
    let services = await prisma.services.findMany({
      where: { provider_id: req.user.id },
      orderBy: { created_at: 'desc' }
    });

    services = await enrichServicesWithBookingStats(services);
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

    const [enrichedService] = await enrichServicesWithBookingStats([service]);

    res.json(enrichedService);
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

    // With CloudinaryStorage, req.file.path is the full public URL
    const imageUrl = req.file.path;

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
