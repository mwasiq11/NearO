import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requirePermission, requireResourcePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validation.js';
import { createServiceSchema, reportServiceSchema, updateOwnServiceSchema } from '../utils/validationSchemas.js';
import { createService, getServices, getServiceById, updateServiceOwn, deleteServiceOwn, reportService, uploadServiceImage } from '../controllers/services.js';
import { pool } from '../db/database.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// GET /services - Get all services (with optional category filter)
router.get('/', optionalAuthenticate, getServices);

// GET /services/:id - Get a specific service by ID
router.get('/:id', optionalAuthenticate, getServiceById);

// POST /services/upload-image - Upload an image for a service
router.post('/upload-image', authenticate, requirePermission('services.create'), uploadSingle, uploadServiceImage);

// POST /services - Create a new service (requires authentication)
router.post('/', authenticate, requirePermission('services.create'), validate(createServiceSchema), createService);

// PUT /services/:id - Update own service
router.put(
  '/:id',
  authenticate,
  requireResourcePermission('services.update_own', async (req) => {
    const [services] = await pool.execute('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
    return services.length > 0 ? services[0].provider_id : null;
  }),
  validate(updateOwnServiceSchema),
  updateServiceOwn
);

// DELETE /services/:id - Delete own service
router.delete(
  '/:id',
  authenticate,
  requireResourcePermission('services.delete_own', async (req) => {
    const [services] = await pool.execute('SELECT provider_id FROM services WHERE id = ?', [req.params.id]);
    return services.length > 0 ? services[0].provider_id : null;
  }),
  deleteServiceOwn
);

// POST /services/:id/report - Report a service
router.post('/:id/report', authenticate, validate(reportServiceSchema, 'body'), reportService);

export default router;
