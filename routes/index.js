
const express = require('express');
const router = express.Router();
const { db } = require('../models/db');
const Book = require('../models/Book');

// Home route
router.get('/', async (req, res) => {
  try {
    const connection = await db.getConnection();
    const [books] = await connection.execute(
      `SELECT books.*, users.name as owner_name 
       FROM books JOIN users ON books.owner_id = users.id 
       WHERE books.status = "available" 
       ORDER BY books.created_at DESC LIMIT 8`
    );

    // Get popular genres
    const [genres] = await connection.execute(
      `SELECT genre, COUNT(*) as count 
       FROM books 
       WHERE genre IS NOT NULL 
       GROUP BY genre 
       ORDER BY count DESC LIMIT 5`
    );

    connection.release();

    res.render('index', {
      books,
      popularGenres: ['Fiction', 'Non-Fiction', 'Science Fiction'],
      isAuthenticated: !!req.session.user,
        user: req.session.user // Add this line
    });
  } catch (error) {
    console.error('Home route error:', error);
    res.status(500).render('error', { message: 'Server Error' });
  }
});

module.exports = router;