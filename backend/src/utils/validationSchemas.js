import Joi from 'joi';

/**
 * Validation schemas using Joi
 */

// User registration schema
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(6).max(100).required()
});

// User login schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

// Service creation schema
const createServiceSchema = Joi.object({
  provider_id: Joi.string().uuid().required(),
  title: Joi.string().min(3).max(255).required().trim(),
  description: Joi.string().min(10).max(2000).required().trim(),
  category: Joi.string().max(100).required().trim(),
  price: Joi.number().min(0).required(),
  availability: Joi.string().required().trim(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  neighborhood: Joi.string().max(255).optional().trim(),
  city: Joi.string().max(255).optional().trim()
}).and('latitude', 'longitude'); // If latitude is provided, longitude must be too

// Update profile schema
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).optional().trim(),
  email: Joi.string().email().optional().lowercase().trim(),
  password: Joi.string().min(6).max(100).optional()
}).or('name', 'email', 'password');

// Update own service schema
const updateOwnServiceSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional().trim(),
  description: Joi.string().min(10).max(2000).optional().trim(),
  category: Joi.string().max(100).optional().trim(),
  price: Joi.number().min(0).optional(),
  availability: Joi.string().optional().trim(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  neighborhood: Joi.string().max(255).optional().trim(),
  city: Joi.string().max(255).optional().trim()
}).and('latitude', 'longitude');

// Review creation schema
const createReviewSchema = Joi.object({
  booking_id: Joi.string().uuid().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().max(1000).optional().trim()
});

// Service search schema
const searchSchema = Joi.object({
  category: Joi.string().max(100).optional().trim(),
  neighborhood: Joi.string().max(255).optional().trim(),
  city: Joi.string().max(255).optional().trim(),
  price_min: Joi.number().min(0).optional(),
  price_max: Joi.number().min(0).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lng: Joi.number().min(-180).max(180).optional(),
  radius: Joi.alternatives().try(
    Joi.string().pattern(/^\d+(km|m)$/i),
    Joi.number().min(0)
  ).optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sort: Joi.string().valid('created_at', 'price', 'title').optional(),
  order: Joi.string().valid('ASC', 'DESC').optional()
}).and('lat', 'lng'); // If lat is provided, lng must be too

// Nearby search schema
const nearbySchema = Joi.object({
  lat: Joi.number().min(-90).max(90).required(),
  lng: Joi.number().min(-180).max(180).required(),
  radius: Joi.alternatives().try(
    Joi.string().pattern(/^\d+(km|m)$/i),
    Joi.number().min(0)
  ).optional(),
  category: Joi.string().max(100).optional().trim(),
  limit: Joi.number().integer().min(1).max(100).optional()
});

// Password reset request schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim()
});

// Password reset schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(100).required()
});

// User suspension schema
const suspendUserSchema = Joi.object({
  duration_hours: Joi.number().integer().min(1).max(8760).required(), // Max 1 year
  reason: Joi.string().max(500).optional().trim()
});

// Warn user schema
const warnUserSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required().trim()
});

// Ban user schema
const banUserSchema = Joi.object({
  reason: Joi.string().min(5).max(500).optional().trim()
});

// Update user role schema
const updateUserRoleSchema = Joi.object({
  role: Joi.string().valid('user', 'moderator', 'admin').required()
});

// Update service schema (admin/moderator)
const updateServiceSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional().trim(),
  description: Joi.string().min(10).max(2000).optional().trim(),
  category: Joi.string().max(100).optional().trim(),
  price: Joi.number().min(0).optional(),
  availability: Joi.string().optional().trim(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  neighborhood: Joi.string().max(255).optional().trim(),
  city: Joi.string().max(255).optional().trim(),
  is_active: Joi.boolean().optional()
}).and('latitude', 'longitude');

// Report service schema
const reportServiceSchema = Joi.object({
  reason: Joi.string().min(10).max(500).required().trim()
});

// Category schemas
const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  description: Joi.string().max(500).optional().trim()
});

const updateCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().trim(),
  description: Joi.string().max(500).optional().trim(),
  is_active: Joi.boolean().optional()
});

// System settings schema
const systemSettingSchema = Joi.object({
  setting_key: Joi.string().min(2).max(100).required().trim(),
  setting_value: Joi.string().allow('').max(1000).required()
});

// Maintenance mode schema
const maintenanceModeSchema = Joi.object({
  enabled: Joi.boolean().required(),
  message: Joi.string().max(1000).optional().trim()
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - 'body', 'query', or 'params'
 * @returns {Function} Express middleware
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'body' ? req.body : source === 'query' ? req.query : req.params;
    
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request data with validated and sanitized data
    if (source === 'body') {
      req.body = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.params = value;
    }

    next();
  };
}

export {
  registerSchema,
  loginSchema,
  createServiceSchema,
  updateProfileSchema,
  updateOwnServiceSchema,
  createReviewSchema,
  searchSchema,
  nearbySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  suspendUserSchema,
  warnUserSchema,
  banUserSchema,
  updateUserRoleSchema,
  updateServiceSchema,
  reportServiceSchema,
  createCategorySchema,
  updateCategorySchema,
  systemSettingSchema,
  maintenanceModeSchema,
  validate
};

