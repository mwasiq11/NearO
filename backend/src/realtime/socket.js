import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { pool } from '../db/database.js';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../queue/redisClient.js';

const onlineUsers = new Map();

function getTokenFromHandshake(socket) {
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }
  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }
  const authHeader = socket.handshake.headers?.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

async function upsertPresence(userId, status, socketId = null) {
  await pool.execute(
    `INSERT INTO user_presence (user_id, status, socket_id, last_seen)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE status = VALUES(status), socket_id = VALUES(socket_id), last_seen = VALUES(last_seen)`,
    [userId, status, socketId, new Date()]
  );
}

async function createConversation(seekerId, providerId, serviceId = null) {
  const [existing] = await pool.execute(
    `SELECT id FROM conversations WHERE seeker_id = ? AND provider_id = ? AND service_id <=> ?`,
    [seekerId, providerId, serviceId]
  );
  if (existing.length > 0) {
    return existing[0].id;
  }
  const conversationId = uuidv4();
  await pool.execute(
    `INSERT INTO conversations (id, seeker_id, provider_id, service_id, last_message_at)
     VALUES (?, ?, ?, ?, ?)`,
    [conversationId, seekerId, providerId, serviceId, new Date()]
  );
  return conversationId;
}

async function insertMessage(conversationId, senderId, receiverId, content) {
  const messageId = uuidv4();
  await pool.execute(
    `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, content, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, conversationId, senderId, receiverId, content, 'sent']
  );
  await pool.execute(
    `UPDATE conversations SET last_message_at = ? WHERE id = ?`,
    [new Date(), conversationId]
  );
  const [messages] = await pool.execute(
    `SELECT * FROM messages WHERE id = ?`,
    [messageId]
  );
  return messages[0];
}

async function userHasConversationAccess(userId, conversationId) {
  const [rows] = await pool.execute(
    `SELECT id FROM conversations WHERE id = ? AND (seeker_id = ? OR provider_id = ?)`,
    [conversationId, userId, userId]
  );
  return rows.length > 0;
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      credentials: true
    }
  });

  io.use((socket, next) => {
    const token = getTokenFromHandshake(socket);
    if (!token) {
      return next(new Error('Authentication token missing'));
    }
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return next(new Error('Invalid or expired token'));
    }
    socket.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };
    next();
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    await upsertPresence(userId, 'online', socket.id);

    // Deliver any queued offline messages
    try {
      const redis = await getRedisClient();
      if (redis) {
        const key = `offline:messages:${userId}`;
        const queued = await redis.lRange(key, 0, -1);
        if (queued.length > 0) {
          for (const raw of queued) {
            const message = JSON.parse(raw);
            socket.emit('message:received', { message, queued: true });
            await pool.execute(
              `UPDATE messages SET status = 'delivered' WHERE id = ?`,
              [message.id]
            );
          }
          await redis.del(key);
        }
      }
    } catch (error) {
      console.error('Failed to deliver offline messages:', error);
    }

    socket.on('conversation:join', async ({ conversationId }) => {
      if (!conversationId) return;
      const hasAccess = await userHasConversationAccess(userId, conversationId);
      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied to conversation' });
        return;
      }
      socket.join(conversationId);
    });

    socket.on('message:send', async (payload, ack) => {
      try {
        const { conversationId, receiverId, content, seekerId, providerId, serviceId } = payload || {};
        if (!content || !receiverId) {
          return ack?.({ error: 'receiverId and content are required' });
        }

        let convoId = conversationId;
        if (!convoId) {
          if (!seekerId || !providerId) {
            return ack?.({ error: 'seekerId and providerId are required to create a conversation' });
          }
          if (![seekerId, providerId].includes(userId)) {
            return ack?.({ error: 'Sender must be a participant in the conversation' });
          }
          convoId = await createConversation(seekerId, providerId, serviceId || null);
        } else {
          const hasAccess = await userHasConversationAccess(userId, convoId);
          if (!hasAccess) {
            return ack?.({ error: 'Access denied to conversation' });
          }
        }

        const message = await insertMessage(convoId, userId, receiverId, content);

        socket.join(convoId);
        socket.emit('message:sent', { message });
        socket.to(convoId).emit('message:received', { message });

        // Get sender name for notification
        const [senderInfo] = await pool.execute(
          `SELECT name FROM users WHERE id = ?`,
          [userId]
        );
        const senderName = senderInfo.length > 0 ? senderInfo[0].name : null;

        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:received', { message });
          await pool.execute(
            `UPDATE messages SET status = 'delivered' WHERE id = ?`,
            [message.id]
          );
        } else {
          const redis = await getRedisClient();
          if (redis) {
            const key = `offline:messages:${receiverId}`;
            await redis.rPush(key, JSON.stringify(message));
            await redis.publish('notifications', JSON.stringify({
              type: 'message',
              receiverId,
              conversationId: convoId,
              messageId: message.id,
              senderName: senderName
            }));
          }
        }

        return ack?.({ success: true, message });
      } catch (error) {
        return ack?.({ error: error.message });
      }
    });

    socket.on('disconnect', async () => {
      onlineUsers.delete(userId);
      await upsertPresence(userId, 'offline', null);
    });
  });

  return io;
}

export { initSocket, onlineUsers };

