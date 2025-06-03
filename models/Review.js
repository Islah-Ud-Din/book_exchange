const { db } = require("./db");

class Review {
  static async create(bookId, reviewerId, rating, comment) {
    const [result] = await db.query(
      "INSERT INTO reviews (book_id, reviewer_id, rating, comment) VALUES (?, ?, ?, ?)",
      [bookId, reviewerId, rating, comment]
    );
    return result.insertId;
  }

  static async delete(reviewId) {
    await db.query("DELETE FROM reviews WHERE id = ?", [reviewId]);
  }

  static async getByBook(bookId) {
    const [reviews] = await db.query(
      `SELECT reviews.*, users.name as reviewer_name 
       FROM reviews JOIN users ON reviews.reviewer_id = users.id 
       WHERE book_id = ? 
       ORDER BY created_at DESC`,
      [bookId]
    );
    return reviews;
  }

  static async getAverageRating(bookId) {
    const [result] = await db.query(
      "SELECT AVG(rating) as avgRating FROM reviews WHERE book_id = ?",
      [bookId]
    );
    return result[0].avgRating || 0;
  }

  static async getUserReview(bookId, userId) {
    const [reviews] = await db.query(
      "SELECT * FROM reviews WHERE book_id = ? AND reviewer_id = ?",
      [bookId, userId]
    );
    return reviews[0] || null;
  }
}

module.exports = Review;
