import { pool } from '../db/database.js';

const listConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await pool.execute(
      `SELECT c.*,
              u1.name AS seeker_name,
              u1.email AS seeker_email,
              u2.name AS provider_name,
              u2.email AS provider_email
       FROM conversations c
       JOIN users u1 ON c.seeker_id = u1.id
       JOIN users u2 ON c.provider_id = u2.id
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
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY created_at ASC
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

export {
  listConversations,
  listMessages
};

