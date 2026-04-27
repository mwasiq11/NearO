import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import prisma from '../db/prisma.js';
import { v4 as uuidv4 } from 'uuid';
import { getRedisClient } from '../queue/redisClient.js';

const onlineUsers = new Map();
let ioInstance = null;

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
  try {
    await prisma.user_presence.upsert({
      where: { user_id: userId },
      update: {
        status,
        socket_id: socketId,
        last_seen: new Date()
      },
      create: {
        user_id: userId,
        status,
        socket_id: socketId,
        last_seen: new Date()
      }
    });
  } catch (error) {
    console.error(`Failed to upsert presence for user ${userId}:`, error.message);
  }
}

async function createConversation(seekerId, providerId, serviceId = null) {
  const existing = await prisma.conversations.findFirst({
    where: {
      seeker_id: seekerId,
      provider_id: providerId
    }
  });

  if (existing) {
    // If it's the first time a service is being linked to this conversation, update it
    if (!existing.service_id && serviceId) {
      await prisma.conversations.update({
        where: { id: existing.id },
        data: { service_id: serviceId }
      });
    }
    return existing.id;
  }

  const conversationId = uuidv4();
  await prisma.conversations.create({
    data: {
      id: conversationId,
      seeker_id: seekerId,
      provider_id: providerId,
      service_id: serviceId,
      last_message_at: new Date()
    }
  });
  return conversationId;
}

async function insertMessage(conversationId, senderId, receiverId, content, serviceId = null) {
  const messageId = uuidv4();
  
  // Use a transaction to ensure message and conversation update are atomic
  const [message] = await prisma.$transaction([
    prisma.messages.create({
      data: {
        id: messageId,
        conversation_id: conversationId,
        sender_id: senderId,
        receiver_id: receiverId,
        service_id: serviceId,
        content,
        status: 'sent'
      }
    }),
    prisma.conversations.update({
      where: { id: conversationId },
      data: { last_message_at: new Date() }
    })
  ]);

  return message;
}

async function userHasConversationAccess(userId, conversationId) {
  const count = await prisma.conversations.count({
    where: {
      id: conversationId,
      OR: [
        { seeker_id: userId },
        { provider_id: userId }
      ]
    }
  });
  return count > 0;
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:8080',
        'http://localhost:8081',
        'http://localhost:8082',
        'http://localhost:8083',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      credentials: true
    }
  });

  ioInstance = io;

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

    // Join role-based rooms for targeted broadcasts
    if (socket.user.role === 'admin' || socket.user.role === 'moderator') {
      socket.join('moderation');
    }

    // Broadcast online status to all users
    io.emit('user:status', { userId, status: 'online' });

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
            await prisma.messages.update({
              where: { id: message.id },
              data: { status: 'delivered' }
            });
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

        const message = await insertMessage(convoId, userId, receiverId, content, serviceId || null);

        socket.join(convoId);
        // Emit to sender only
        socket.emit('message:sent', { message });
        // Emit to all others in the room (covers receiver if they have the conversation open)
        socket.to(convoId).emit('message:received', { message });

        // Get sender name for notification
        const sender = await prisma.users.findUnique({
          where: { id: userId },
          select: { name: true }
        });
        const senderName = sender?.name;

        // If receiver is online but NOT in the conversation room, deliver directly
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          const receiverSocket = io.sockets.sockets.get(receiverSocketId);
          const isInRoom = receiverSocket?.rooms?.has(convoId);
          if (!isInRoom) {
            io.to(receiverSocketId).emit('message:received', { message });
          }
          await prisma.messages.update({
            where: { id: message.id },
            data: { status: 'delivered' }
          });
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

    // ─── Call Signaling ───────────────────────────────────────
    socket.on('call:initiate', ({ receiverId, callType, roomName }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('call:incoming', {
          callerId: userId,
          callerName: socket.user.email, // will be enriched by frontend
          callType, // 'audio' or 'video'
          roomName,
        });
      } else {
        socket.emit('call:unavailable', { receiverId });
      }
    });

    socket.on('call:accept', ({ callerId, roomName }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:accepted', { acceptedBy: userId, roomName });
      }
    });

    socket.on('call:decline', ({ callerId }) => {
      const callerSocketId = onlineUsers.get(callerId);
      if (callerSocketId) {
        io.to(callerSocketId).emit('call:declined', { declinedBy: userId });
      }
    });

    socket.on('call:end', ({ otherUserId }) => {
      const otherSocketId = onlineUsers.get(otherUserId);
      if (otherSocketId) {
        io.to(otherSocketId).emit('call:ended', { endedBy: userId });
      }
    });

    socket.on('disconnect', async () => {
      try {
        onlineUsers.delete(userId);
        await upsertPresence(userId, 'offline', null);
        // Broadcast offline status to all users
        io.emit('user:status', { userId, status: 'offline' });
      } catch (error) {
        console.error('Socket disconnect error:', error);
      }
    });
  });

  return io;
}

// Helper function to check if user is online
function isUserOnline(userId) {
  return onlineUsers.has(userId);
}

// Get all online users
function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

// Get io instance for use in controllers
function getIO() {
  return ioInstance;
}

export { initSocket, onlineUsers, isUserOnline, getOnlineUsers, getIO };

