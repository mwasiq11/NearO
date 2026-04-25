import { v4 as uuidv4 } from 'uuid';
import prisma from '../db/prisma.js';
import { getFileUrl, getFileCategory } from '../middleware/upload.js';
import { isUserOnline } from '../realtime/socket.js';
import { publishNotification } from '../services/eventService.js';

const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const rows = await prisma.conversations.findMany({
      where: {
        OR: [
          { seeker_id: userId },
          { provider_id: userId }
        ]
      },
      include: {
        users_conversations_seeker_idTousers: {
          select: { name: true, email: true }
        },
        users_conversations_provider_idTousers: {
          select: { name: true, email: true }
        },
        services: {
          select: { title: true }
        }
      },
      orderBy: { last_message_at: 'desc' }
    });

    const mappedRows = rows.map(conv => {
      const isSeeker = conv.seeker_id === userId;
      return {
        ...conv,
        seeker_name: conv.users_conversations_seeker_idTousers.name,
        seeker_email: conv.users_conversations_seeker_idTousers.email,
        provider_name: conv.users_conversations_provider_idTousers.name,
        provider_email: conv.users_conversations_provider_idTousers.email,
        service_title: conv.services?.title,
        unread_count: Number(isSeeker ? conv.seeker_unread_count : conv.provider_unread_count) || 0
      };
    });

    // Add online status for each conversation
    const conversationsWithStatus = mappedRows.map(conv => {
      const otherUserId = conv.seeker_id === userId ? conv.provider_id : conv.seeker_id;
      return {
        ...conv,
        other_user_online: isUserOnline(otherUserId),
      };
    });

    res.json({ conversations: conversationsWithStatus });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ error: error.message });
  }
};

const listMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const pageNum = parseInt(req.query.page) || 1;
    const limitNum = parseInt(req.query.limit) || 50;
    const offsetNum = (pageNum - 1) * limitNum;

    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { seeker_id: userId },
          { provider_id: userId }
        ]
      }
    });

    if (!conversation) {
      return res.status(403).json({ error: 'Access denied to conversation' });
    }

    // Note: LIMIT and OFFSET cannot use placeholders in MySQL prepared statements
    const messages = await prisma.messages.findMany({
      where: { conversation_id: conversationId },
      include: {
        users_messages_sender_idTousers: {
          select: { name: true }
        }
      },
      orderBy: { created_at: 'asc' },
      skip: offsetNum,
      take: limitNum
    });

    const mappedMessages = messages.map(m => ({
      ...m,
      sender_name: m.users_messages_sender_idTousers.name
    }));

    res.json({
      messages: mappedMessages,
      pagination: {
        page: pageNum,
        limit: limitNum,
        count: messages.length
      }
    });
  } catch (error) {
    console.error('Error listing messages:', error);
    res.status(500).json({ error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId, receiverId, content, messageType = 'text' } = req.body;
    const file = req.file;

    console.log('Send message request:', { 
      userId, 
      conversationId, 
      receiverId, 
      content: content?.substring(0, 50), 
      messageType,
      hasFile: !!file,
      fileName: file?.filename
    });

    // Verify conversation access
    const conversation = await prisma.conversations.findFirst({
      where: {
        id: conversationId,
        OR: [
          { seeker_id: userId },
          { provider_id: userId }
        ]
      }
    });

    if (!conversation) {
      console.log('Conversation access denied:', conversationId);
      return res.status(403).json({ error: 'Access denied to conversation' });
    }

    const messageId = uuidv4();
    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let fileType = null;
    let duration = null;
    let finalMessageType = messageType;

    // Handle file upload
    if (file) {
      // With CloudinaryStorage, req.file.path is the full public URL
      fileUrl = file.path;
      fileName = file.originalname;
      fileSize = file.size;
      fileType = file.mimetype;
      finalMessageType = getFileCategory(file.mimetype);

      console.log('☁️ File uploaded to Cloudinary:', { fileUrl, fileName, fileSize, fileType, finalMessageType });

      // Store file upload record
      await prisma.file_uploads.create({
        data: {
          id: uuidv4(),
          user_id: userId,
          file_name: file.filename,
          original_name: file.originalname,
          file_path: file.path,
          file_type: file.mimetype,
          file_size: file.size,
          upload_context: uploadContext
        }
      });
    }

    // Insert message
    const newMessageRecord = await prisma.messages.create({
      data: {
        id: messageId,
        conversation_id: conversationId,
        sender_id: userId,
        receiver_id: receiverId,
        message_type: finalMessageType,
        content: content || null,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        file_type: fileType,
        duration: duration,
        status: 'sent'
      }
    });

    // Increment unread count for receiver
    const previewContent = content 
      ? content.substring(0, 100) 
      : finalMessageType === 'image' 
        ? 'Image attachment'
        : finalMessageType === 'voice'
          ? 'Voice message'
          : finalMessageType === 'document'
            ? `File: ${fileName || 'unnamed'}`
            : 'Attachment';
    
    const isReceiverSeeker = conversation.seeker_id === receiverId;
    const updateData = {
      last_message_at: new Date(),
      last_message_preview: previewContent,
      last_message_type: finalMessageType
    };

    if (isReceiverSeeker) {
      updateData.seeker_unread_count = { increment: 1 };
    } else {
      updateData.provider_unread_count = { increment: 1 };
    }

    await prisma.conversations.update({
      where: { id: conversationId },
      data: updateData
    });

    // Create notification for receiver
    try {
      const sender = await prisma.users.findUnique({
        where: { id: userId },
        select: { name: true }
      });
      
      await publishNotification(receiverId, 'message', {
        conversationId,
        messageId,
        senderName: sender?.name,
        preview: previewContent
      });
      console.log(`✅ Notification published for receiver about new message`);
    } catch (notifError) {
      console.error('Warning: Failed to publish notification:', notifError);
    }

    const newMessageWithSender = await prisma.messages.findUnique({
      where: { id: messageId },
      include: {
        users_messages_sender_idTousers: { select: { name: true } }
      }
    });

    res.status(201).json({ 
      message: {
        ...newMessageWithSender,
        sender_name: newMessageWithSender.users_messages_sender_idTousers.name
      } 
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    // Get conversation info
    const conversation = await prisma.conversations.findUnique({
      where: { id: conversationId }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark all messages as read where user is the receiver
    await prisma.messages.updateMany({
      where: {
        conversation_id: conversationId,
        receiver_id: userId,
        status: { not: 'read' }
      },
      data: { status: 'read' }
    });

    // Reset unread count for this user
    const isSeeker = conversation.seeker_id === userId;
    const updateData = isSeeker ? { seeker_unread_count: 0 } : { provider_unread_count: 0 };
    
    await prisma.conversations.update({
      where: { id: conversationId },
      data: updateData
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  listConversations,
  listMessages,
  sendMessage,
  markAsRead
};

