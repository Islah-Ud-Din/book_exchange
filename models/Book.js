const { db } = require("./db");

class Book {
  static async create(bookData) {
    const {
      title,
      author,
      genre,
      book_condition,
      description,
      image_url,
      purchase_url,
      location,
      owner_id,
    } = bookData;
    const [result] = await db.query(
      `INSERT INTO books
       (title, author, genre, book_condition, description, image_url, purchase_url, location, owner_id, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')`,
      [
        title,
        author,
        genre,
        book_condition,
        description,
        image_url,
        purchase_url,
        location,
        owner_id,
      ]
    );
    return result.insertId;
  }

  static async findById(id) {
    console.log("findById", id);

    const [rows] = await db.query(
      `SELECT books.*, users.name as owner_name, users.location as owner_location
       FROM books JOIN users ON books.owner_id = users.id
       WHERE books.id = ?`,
      [id]
    );
    return rows[0];
  }

  static async findBooksByUserId(id) {
    console.log("findById", id);

    const [rows] = await db.query(`SELECT * FROM books WHERE owner_id = ?`, [
      id,
    ]);
    console.log("db.query select", rows);
    console.log("islah", rows);

    return rows;
  }

  static async update(id, bookData) {
    const {
      title,
      author,
      genre,
      book_condition,
      description,
      image_url,
      purchase_url,
      location,
      status,
    } = bookData;
    await db.query(
      `UPDATE books SET
       title = ?, author = ?, genre = ?, book_condition = ?, description = ?,
       image_url = ?, purchase_url = ?, location = ?, status = ?
       WHERE id = ?`,
      [
        title,
        author,
        genre,
        book_condition,
        description,
        image_url,
        purchase_url,
        location,
        status,
        id,
      ]
    );
  }

  static async delete(id) {
    await db.query("DELETE FROM books WHERE id = ?", [id]);
  }

  static async findByOwner(ownerId) {
    const [rows] = await db.query(
      "SELECT * FROM books WHERE owner_id = ? ORDER BY created_at DESC",
      [ownerId]
    );
    return rows;
  }

  static async search({ query, genre, location }) {
    let sql = `SELECT books.*, users.name as owner_name
               FROM books JOIN users ON books.owner_id = users.id
               WHERE books.status = 'available'`;
    const params = [];

    if (query) {
      sql += " AND (books.title LIKE ? OR books.author LIKE ?)";
      params.push(`%${query}%`, `%${query}%`);
    }

    if (genre) {
      sql += " AND books.genre = ?";
      params.push(genre);
    }

    if (location) {
      sql += " AND users.location LIKE ?";
      params.push(`%${location}%`);
    }

    sql += " ORDER BY books.created_at DESC";

    const [rows] = await db.query(sql, params);
    return rows;
  }

  static async getPopularGenres(limit = 5) {
    const [rows] = await db.query(
      `SELECT genre, COUNT(*) as count
       FROM books
       WHERE genre IS NOT NULL
       GROUP BY genre
       ORDER BY count DESC LIMIT ?`,
      [limit]
    );
    return rows;
  }
}

module.exports = Book;
