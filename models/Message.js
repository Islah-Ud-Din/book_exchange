const { db } = require("./db");

class Message {
  static async createInitialMessage(requestId, senderId, receiverId, message) {
    const [result] = await db.query(
      `INSERT INTO messages (request_id, sender_id, receiver_id, message) 
       VALUES (?, ?, ?, ?)`,
      [requestId, senderId, receiverId, message]
    );
    return result.insertId;
  }

  static async sendMessage(conversationId, senderId, message) {
    // First get receiver ID from existing message
    const [existing] = await db.query(
      "SELECT sender_id, receiver_id FROM messages WHERE id = ?",
      [conversationId]
    );

    if (existing.length === 0) {
      throw new Error("Conversation not found");
    }

    const originalMessage = existing[0];
    const receiverId =
      senderId === originalMessage.sender_id
        ? originalMessage.receiver_id
        : originalMessage.sender_id;

    const [result] = await db.query(
      `INSERT INTO messages (request_id, sender_id, receiver_id, message) 
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, receiverId, message]
    );

    return result.insertId;
  }

  static async getConversations(userId) {
    const [conversations] = await db.query(
      `SELECT m.id as conversation_id, 
              CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END as other_user_id,
              CASE WHEN m.sender_id = ? THEN u2.name ELSE u1.name END as other_user_name,
              m.message as last_message_content,
              m.created_at as last_message_date,
              COUNT(CASE WHEN m2.is_read = FALSE AND m2.receiver_id = ? THEN 1 ELSE NULL END) as unread_count
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       LEFT JOIN messages m2 ON m.request_id = m2.request_id
       WHERE (m.sender_id = ? OR m.receiver_id = ?)
         AND m.id IN (
           SELECT MAX(id) FROM messages GROUP BY request_id
         )
       GROUP BY m.id, other_user_id, other_user_name, last_message_content, last_message_date
       ORDER BY last_message_date DESC`,
      [userId, userId, userId, userId, userId]
    );

    return conversations;
  }

  static async getConversation(conversationId, userId) {
    // First verify user is part of conversation
    const [verify] = await db.query(
      "SELECT id FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)",
      [conversationId, userId, userId]
    );

    if (verify.length === 0) return null;

    // Get all messages in conversation
    const [messages] = await db.query(
      `SELECT m.*, u1.name as sender_name, u2.name as receiver_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE m.request_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );

    if (messages.length === 0) return null;

    // Get other user info
    const otherUser =
      userId === messages[0].sender_id
        ? { id: messages[0].receiver_id, name: messages[0].receiver_name }
        : { id: messages[0].sender_id, name: messages[0].sender_name };

    return {
      id: conversationId,
      otherUser,
      messages,
    };
  }

  static async markAsRead(conversationId, userId) {
    await db.query(
      `UPDATE messages 
       SET is_read = TRUE 
       WHERE request_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [conversationId, userId]
    );
  }
}

module.exports = Message;
