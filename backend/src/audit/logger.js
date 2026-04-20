import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';

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
  // Fire and forget audit logging to avoid blocking the main request
  prisma.audit_logs.create({
    data: {
      id: uuidv4(),
      actor_id: actorId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue ? (typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue)) : null,
      new_value: newValue ? (typeof newValue === 'string' ? newValue : JSON.stringify(newValue)) : null,
      metadata: metadata ? (typeof metadata === 'string' ? metadata : JSON.stringify(metadata)) : null,
      ip_address: ipAddress,
      user_agent: userAgent
    }
  }).catch(err => {
    console.error(`[Audit Log Failure] Action: ${actionType}, Actor: ${actorId}, Error:`, err.message);
  });
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

