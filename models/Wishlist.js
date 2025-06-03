const { db } = require("./db");

class Wishlist {
  /**
   * Add a book to user's wishlist
   * @param {number} userId - ID of the user
   * @param {string} title - Book title
   * @param {string} author - Book author
   * @param {string} genre - Book genre
   * @returns {Promise<number>} - ID of the created wishlist item
   */
  static async create(userId, title, author, genre) {
    const [result] = await db.query(
      "INSERT INTO wishlist (user_id, title, author, genre) VALUES (?, ?, ?, ?)",
      [userId, title, author || null, genre || null]
    );
    return result.insertId;
  }

  /**
   * Get all wishlist items for a user
   * @param {number} userId - ID of the user
   * @returns {Promise<Array>} - Array of wishlist items
   */
  static async getByUser(userId) {
    const [rows] = await db.query(
      "SELECT * FROM wishlist WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    return rows;
  }

  /**
   * Remove an item from wishlist
   * @param {number} wishlistId - ID of the wishlist item
   * @returns {Promise<void>}
   */
  static async delete(wishlistId) {
    await db.query("DELETE FROM wishlist WHERE id = ?", [wishlistId]);
  }

  /**
   * Check if a book already exists in user's wishlist
   * @param {number} userId - ID of the user
   * @param {string} title - Book title
   * @param {string} author - Book author
   * @returns {Promise<boolean>} - Whether the book exists in wishlist
   */
  static async exists(userId, title, author) {
    const [rows] = await db.query(
      "SELECT id FROM wishlist WHERE user_id = ? AND title = ? AND author = ?",
      [userId, title, author || null]
    );
    return rows.length > 0;
  }

  /**
   * Get wishlist items that match newly available books
   * @param {number} userId - ID of the user
   * @returns {Promise<Array>} - Array of matching books
   */
  static async getMatches(userId) {
    const [rows] = await db.query(
      `SELECT b.*, w.id as wishlist_id 
       FROM wishlist w
       JOIN books b ON 
         (b.title LIKE CONCAT('%', w.title, '%') OR
         (w.author IS NOT NULL AND b.author LIKE CONCAT('%', w.author, '%'))
       WHERE w.user_id = ? AND b.status = 'available'
       GROUP BY b.id`,
      [userId]
    );
    return rows;
  }
}

module.exports = Wishlist;
