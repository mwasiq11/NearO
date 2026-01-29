import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/database.js';
import { getFileUrl, getFileCategory } from '../middleware/upload.js';
import { isUserOnline } from '../realtime/socket.js';

const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT c.*,
              u1.name AS seeker_name,
              u1.email AS seeker_email,
              u2.name AS provider_name,
              u2.email AS provider_email,
              s.title AS service_title,
              CASE 
                WHEN c.seeker_id = ? THEN c.seeker_unread_count
                ELSE c.provider_unread_count
              END as unread_count
       FROM conversations c
       JOIN users u1 ON c.seeker_id = u1.id
       JOIN users u2 ON c.provider_id = u2.id
       LEFT JOIN services s ON c.service_id = s.id
       WHERE c.seeker_id = ? OR c.provider_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId]
    );

    // Add online status for each conversation
    const conversationsWithStatus = rows.map(conv => {
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

    const [conversations] = await pool.execute(
      `SELECT id FROM conversations WHERE id = ? AND (seeker_id = ? OR provider_id = ?)`,
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Access denied to conversation' });
    }

    // Note: LIMIT and OFFSET cannot use placeholders in MySQL prepared statements
    const [messages] = await pool.execute(
      `SELECT m.*, 
              u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT ${limitNum} OFFSET ${offsetNum}`,
      [conversationId]
    );

    res.json({
      messages,
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
    const [conversations] = await pool.execute(
      `SELECT * FROM conversations WHERE id = ? AND (seeker_id = ? OR provider_id = ?)`,
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
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
      fileUrl = getFileUrl(file.filename, 'messages');
      fileName = file.originalname;
      fileSize = file.size;
      fileType = file.mimetype;
      finalMessageType = getFileCategory(file.mimetype);

      console.log('File uploaded:', { fileUrl, fileName, fileSize, fileType, finalMessageType });

      // Store file upload record
      const uploadContext = finalMessageType === 'image' ? 'message_image' : 
                           finalMessageType === 'voice' ? 'message_voice' : 
                           'service_image'; // Use service_image for files as fallback
      
      await pool.execute(
        `INSERT INTO file_uploads (id, user_id, file_name, original_name, file_path, file_type, file_size, upload_context)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, file.filename, file.originalname, file.path, file.mimetype, file.size, uploadContext]
      );
    }

    // Insert message
    await pool.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, message_type, content, file_url, file_name, file_size, file_type, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')`,
      [messageId, conversationId, userId, receiverId, finalMessageType, content || null, fileUrl, fileName, fileSize, fileType, duration]
    );

    // Increment unread count for receiver
    const [convInfo] = await pool.execute(
      `SELECT seeker_id, provider_id FROM conversations WHERE id = ?`,
      [conversationId]
    );
    
    // Create preview content
    const previewContent = content 
      ? content.substring(0, 100) 
      : finalMessageType === 'image' 
        ? '📷 Image'
        : finalMessageType === 'voice'
          ? '🎤 Voice message'
          : finalMessageType === 'document'
            ? `📄 ${fileName || 'File'}`
            : 'Attachment';
    
    if (convInfo.length > 0) {
      const isReceiverSeeker = convInfo[0].seeker_id === receiverId;
      const unreadColumn = isReceiverSeeker ? 'seeker_unread_count' : 'provider_unread_count';
      
      await pool.execute(
        `UPDATE conversations SET ${unreadColumn} = ${unreadColumn} + 1, last_message_at = NOW(), 
         last_message_preview = ?, last_message_type = ? WHERE id = ?`,
        [previewContent, finalMessageType, conversationId]
      );

      // Create notification for receiver
      const notificationId = uuidv4();
      await pool.execute(
        `INSERT INTO notifications (id, user_id, type, title, message, entity_type, entity_id, created_at)
         VALUES (?, ?, 'new_message', 'New Message', ?, 'message', ?, NOW())`,
        [notificationId, receiverId, previewContent, messageId]
      );
    } else {
      // Fallback if conversation info not found
      await pool.execute(
        `UPDATE conversations 
         SET last_message_at = NOW(), 
             last_message_preview = ?,
             last_message_type = ?
         WHERE id = ?`,
        [previewContent, finalMessageType, conversationId]
      );
    }

    const [newMessage] = await pool.execute(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [messageId]
    );

    res.status(201).json({ message: newMessage[0] });
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
    const [convInfo] = await pool.execute(
      `SELECT seeker_id, provider_id FROM conversations WHERE id = ?`,
      [conversationId]
    );

    if (convInfo.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Mark all messages as read where user is the receiver
    await pool.execute(
      `UPDATE messages SET status = 'read' 
       WHERE conversation_id = ? AND receiver_id = ? AND status != 'read'`,
      [conversationId, userId]
    );

    // Reset unread count for this user
    const isSeeker = convInfo[0].seeker_id === userId;
    const unreadColumn = isSeeker ? 'seeker_unread_count' : 'provider_unread_count';
    
    await pool.execute(
      `UPDATE conversations SET ${unreadColumn} = 0 WHERE id = ?`,
      [conversationId]
    );

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

