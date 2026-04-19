import express from 'express';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { requirePermission, requireResourcePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validation.js';
import { createServiceSchema, reportServiceSchema, updateOwnServiceSchema } from '../utils/validationSchemas.js';
import { createService, getServices, getServiceById, updateServiceOwn, deleteServiceOwn, reportService, uploadServiceImage, getMyServices } from '../controllers/services.js';
import prisma from '../db/prisma.js';
import { uploadSingle } from '../middleware/upload.js';

const router = express.Router();

// GET /services - Get all services (with optional category filter)
router.get('/', optionalAuthenticate, getServices);

// GET /services/owned/me - Get full list of services owned by the provider
router.get('/owned/me', authenticate, getMyServices);

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
    const service = await prisma.services.findUnique({
      where: { id: req.params.id },
      select: { provider_id: true }
    });
    return service ? service.provider_id : null;
  }),
  validate(updateOwnServiceSchema),
  updateServiceOwn
);

// DELETE /services/:id - Delete own service
router.delete(
  '/:id',
  authenticate,
  requireResourcePermission('services.delete_own', async (req) => {
    const service = await prisma.services.findUnique({
      where: { id: req.params.id },
      select: { provider_id: true }
    });
    return service ? service.provider_id : null;
  }),
  deleteServiceOwn
);

// POST /services/:id/report - Report a service
router.post('/:id/report', authenticate, validate(reportServiceSchema, 'body'), reportService);

export default router;
