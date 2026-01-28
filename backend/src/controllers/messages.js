import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/database.js';
import { getFileUrl, getFileCategory } from '../middleware/upload.js';

const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT c.*,
              u1.name AS seeker_name,
              u1.email AS seeker_email,
              u1.profile_picture AS seeker_picture,
              u2.name AS provider_name,
              u2.email AS provider_email,
              u2.profile_picture AS provider_picture,
              s.title AS service_title
       FROM conversations c
       JOIN users u1 ON c.seeker_id = u1.id
       JOIN users u2 ON c.provider_id = u2.id
       LEFT JOIN services s ON c.service_id = s.id
       WHERE c.seeker_id = ? OR c.provider_id = ?
       ORDER BY c.last_message_at DESC, c.updated_at DESC`,
      [userId, userId]
    );
    res.json({ conversations: rows });
  } catch (error) {
    console.error('Error listing conversations:', error);
    res.status(500).json({ error: error.message });
  }
};

const listMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [conversations] = await pool.execute(
      `SELECT id FROM conversations WHERE id = ? AND (seeker_id = ? OR provider_id = ?)`,
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
      return res.status(403).json({ error: 'Access denied to conversation' });
    }

    const [messages] = await pool.execute(
      `SELECT m.*, 
              u.name as sender_name, 
              u.profile_picture as sender_picture
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC
       LIMIT ? OFFSET ?`,
      [conversationId, parseInt(limit), offset]
    );

    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
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

    // Verify conversation access
    const [conversations] = await pool.execute(
      `SELECT * FROM conversations WHERE id = ? AND (seeker_id = ? OR provider_id = ?)`,
      [conversationId, userId, userId]
    );

    if (conversations.length === 0) {
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

      // Store file upload record
      await pool.execute(
        `INSERT INTO file_uploads (id, user_id, file_name, original_name, file_path, file_type, file_size, upload_context)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), userId, file.filename, file.originalname, file.path, file.mimetype, file.size, 'message_' + finalMessageType]
      );
    }

    // Insert message
    await pool.execute(
      `INSERT INTO messages (id, conversation_id, sender_id, receiver_id, message_type, content, file_url, file_name, file_size, file_type, duration, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent')`,
      [messageId, conversationId, userId, receiverId, finalMessageType, content || null, fileUrl, fileName, fileSize, fileType, duration]
    );

    // Update conversation last message
    const previewContent = content || (finalMessageType === 'image' ? '📷 Image' : finalMessageType === 'voice' ? '🎤 Voice message' : '📎 File');
    await pool.execute(
      `UPDATE conversations 
       SET last_message_at = NOW(), 
           last_message_preview = ?,
           last_message_type = ?
       WHERE id = ?`,
      [previewContent, finalMessageType, conversationId]
    );

    const [newMessage] = await pool.execute(
      `SELECT m.*, u.name as sender_name, u.profile_picture as sender_picture
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
    const { messageId } = req.params;

    await pool.execute(
      `UPDATE messages SET status = 'read' 
       WHERE id = ? AND receiver_id = ?`,
      [messageId, userId]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: error.message });
  }
};

export {
  listConversations,
  listMessages,
  sendMessage,
  markAsRead
};

