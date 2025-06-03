const { db } = require("./db");

class Request {
  static async create(bookId, requesterId, message) {
    const [result] = await db.query(
      "INSERT INTO requests (book_id, requester_id, message) VALUES (?, ?, ?)",
      [bookId, requesterId, message]
    );
    return result.insertId;
  }

  static async updateStatus(requestId, status) {
    await db.query("UPDATE requests SET status = ? WHERE id = ?", [
      status,
      requestId,
    ]);
  }

  static async getDetails(requestId, userId) {
    const [requests] = await db.query(
      `SELECT requests.*, books.title as book_title, books.owner_id,
              requester.name as requester_name, owner.name as owner_name
       FROM requests
       JOIN books ON requests.book_id = books.id
       JOIN users as requester ON requests.requester_id = requester.id
       JOIN users as owner ON books.owner_id = owner.id
       WHERE requests.id = ? AND (books.owner_id = ? OR requests.requester_id = ?)`,
      [requestId, userId, userId]
    );

    if (requests.length === 0) return null;

    const request = requests[0];

    // Get conversation ID if exists
    const [conversations] = await db.query(
      "SELECT id FROM messages WHERE request_id = ? LIMIT 1",
      [requestId]
    );

    if (conversations.length > 0) {
      request.conversation_id = conversations[0].id;
    }

    return request;
  }

  static async getByUser(userId) {
    // Get incoming requests (where user is book owner)
    const [incoming] = await db.query(
      `SELECT requests.*, books.title as book_title, users.name as requester_name
       FROM requests
       JOIN books ON requests.book_id = books.id
       JOIN users ON requests.requester_id = users.id
       WHERE books.owner_id = ?
       ORDER BY requests.created_at DESC`,
      [userId]
    );

    // Get outgoing requests (where user is requester)
    const [outgoing] = await db.query(
      `SELECT requests.*, books.title as book_title, users.name as owner_name
       FROM requests
       JOIN books ON requests.book_id = books.id
       JOIN users ON books.owner_id = users.id
       WHERE requests.requester_id = ?
       ORDER BY requests.created_at DESC`,
      [userId]
    );

    // Add conversation IDs
    for (let request of [...incoming, ...outgoing]) {
      const [conversations] = await db.query(
        "SELECT id FROM messages WHERE request_id = ? LIMIT 1",
        [request.id]
      );

      if (conversations.length > 0) {
        request.conversation_id = conversations[0].id;
      }
    }

    return { incoming, outgoing };
  }
}

module.exports = Request;
