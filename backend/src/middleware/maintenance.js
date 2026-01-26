import { pool } from '../db/database.js';

let cache = {
  enabled: false,
  message: 'System is under maintenance. Please try again later.',
  lastChecked: 0
};

const CACHE_TTL_MS = 30000;

async function loadMaintenanceSettings() {
  const [settings] = await pool.execute(
    'SELECT setting_key, setting_value FROM system_settings WHERE setting_key IN (?, ?)',
    ['maintenance_mode', 'maintenance_message']
  );

  const map = {};
  for (const setting of settings) {
    map[setting.setting_key] = setting.setting_value;
  }

  cache.enabled = map.maintenance_mode === 'true';
  cache.message = map.maintenance_message || cache.message;
  cache.lastChecked = Date.now();
}

async function maintenanceMiddleware(req, res, next) {
  try {
    if (Date.now() - cache.lastChecked > CACHE_TTL_MS) {
      await loadMaintenanceSettings();
    }

    if (!cache.enabled) {
      return next();
    }

    // Allow admin/system endpoints to bypass maintenance
    if (req.path.startsWith('/admin') || req.path.startsWith('/auth')) {
      return next();
    }

    return res.status(503).json({
      error: 'Service Unavailable',
      message: cache.message
    });
  } catch (error) {
    return next();
  }
}

export default maintenanceMiddleware;

