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
  await prisma.audit_logs.create({
    data: {
      id: uuidv4(),
      actor_id: actorId,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId,
      old_value: oldValue ? JSON.stringify(oldValue) : null,
      new_value: newValue ? JSON.stringify(newValue) : null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ip_address: ipAddress,
      user_agent: userAgent
    }
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

