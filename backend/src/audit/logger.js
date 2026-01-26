import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/database.js';

async function logAudit({
  actorId = null,
  actionType,
  entityType,
  entityId = null,
  oldValue = null,
  newValue = null,
  metadata = null,
  ipAddress = null,
  userAgent = null
}) {
  await pool.execute(
    `INSERT INTO audit_logs (id, actor_id, action_type, entity_type, entity_id, old_value, new_value, metadata, ip_address, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uuidv4(),
      actorId,
      actionType,
      entityType,
      entityId,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      metadata ? JSON.stringify(metadata) : null,
      ipAddress,
      userAgent
    ]
  );
}

function buildRequestContext(req) {
  return {
    ipAddress: req.ip || req.connection?.remoteAddress || null,
    userAgent: req.headers['user-agent'] || null
  };
}

export {
  logAudit,
  buildRequestContext
};

