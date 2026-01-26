import { v4 as uuidv4 } from 'uuid';
import { pool, readPool } from '../db/database.js';
import { normalizeLocation } from '../utils/location.js';
import { invalidateCache } from '../cache/cache.js';
import { logAudit, buildRequestContext } from '../audit/logger.js';

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
      city
    } = req.body;

    // Validation
    if (!provider_id || !title || !description || !category || price === undefined || !availability) {
      return res.status(400).json({ error: 'All required fields are missing' });
    }

    if (price < 0) {
      return res.status(400).json({ error: 'Price must be non-negative' });
    }

    // Check if provider exists
    const [providers] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [provider_id]
    );

    if (providers.length === 0) {
      return res.status(400).json({ error: 'Provider does not exist' });
    }

    const id = uuidv4();

    // Normalize location data if provided
    let locationData = null;
    if (latitude && longitude) {
      locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
    }

    // Insert service with location data
    if (locationData) {
      await pool.execute(
        `INSERT INTO services 
         (id, provider_id, title, description, category, price, availability, 
          latitude, longitude, s2_cell_id, neighborhood, city) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, provider_id, title, description, category, price, availability,
          locationData.latitude, locationData.longitude, 
          locationData.s2_cell_id ? locationData.s2_cell_id.toString() : null,
          locationData.neighborhood, locationData.city
        ]
      );
    } else {
      await pool.execute(
        'INSERT INTO services (id, provider_id, title, description, category, price, availability) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, provider_id, title, description, category, price, availability]
      );
    }

    const [newService] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);

    res.status(201).json(newService[0]);

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
    const { category } = req.query;
    let query = 'SELECT * FROM services WHERE is_active = TRUE ORDER BY created_at DESC';
    let params = [];

    if (category) {
      query = 'SELECT * FROM services WHERE category = ? AND is_active = TRUE ORDER BY created_at DESC';
      params = [category];
    }

    const [services] = await readPool.execute(query, params);
    res.json(services);
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({ error: error.message });
  }
};

const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    const [services] = await readPool.execute(
      'SELECT * FROM services WHERE id = ?',
      [id]
    );

    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(services[0]);
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
      city
    } = req.body;

    const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (availability !== undefined) { updates.push('availability = ?'); params.push(availability); }

    if (latitude !== undefined || longitude !== undefined) {
      if (latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: 'Both latitude and longitude are required for location updates' });
      }
      const locationData = normalizeLocation({ latitude, longitude, neighborhood, city });
      if (!locationData) {
        return res.status(400).json({ error: 'Invalid location data' });
      }
      updates.push('latitude = ?', 'longitude = ?', 's2_cell_id = ?', 'neighborhood = ?', 'city = ?');
      params.push(
        locationData.latitude,
        locationData.longitude,
        locationData.s2_cell_id ? locationData.s2_cell_id.toString() : null,
        locationData.neighborhood,
        locationData.city
      );
    } else {
      if (neighborhood !== undefined) { updates.push('neighborhood = ?'); params.push(neighborhood); }
      if (city !== undefined) { updates.push('city = ?'); params.push(city); }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    await pool.execute(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await pool.execute('SELECT * FROM services WHERE id = ?', [id]);
    res.json(updated[0]);

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

    const [existing] = await pool.execute('SELECT city FROM services WHERE id = ?', [id]);
    const [services] = await pool.execute('SELECT id FROM services WHERE id = ?', [id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await pool.execute('DELETE FROM services WHERE id = ?', [id]);
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
    const [services] = await pool.execute('SELECT provider_id FROM services WHERE id = ?', [id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const service = services[0];
    const reportId = uuidv4();

    await pool.execute(
      'INSERT INTO user_reports (id, reported_user_id, reported_by, service_id, reason) VALUES (?, ?, ?, ?, ?)',
      [reportId, service.provider_id, req.user.id, id, reason]
    );

    res.status(201).json({ message: 'Service reported successfully' });
  } catch (error) {
    console.error('Error reporting service:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  createService,
  getServices,
  getServiceById,
  updateServiceOwn,
  deleteServiceOwn,
  reportService
};
