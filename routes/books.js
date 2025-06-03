const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const path = require('path');
const { dbConfig } = require('../models/db');

// Add Book - GET
router.get('/add', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to add a book');
        return res.redirect('/login');
    }
    if (someCondition) {
        res.render('books/add', { user: req.session.user });
    } else {
        res.render('wishlist/add', { user: req.session.user });
    }
});

// Add Book - POST
router.post('/add', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to add a book');
        return res.redirect('/login');
    }

    const { title, author, genre, book_condition, description, image, purchase_url, location } = req.body;
    console.log(req.body, 'Request Body');

    const owner_id = req.session.user.id;

    try {
        const connection = await mysql.createConnection(dbConfig);
        const bookRes = await connection.execute(
            'INSERT INTO books (title, author, genre, book_condition, description, image_url, purchase_url, location, owner_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, "available")',
            [
                title || null,
                author || null,
                genre || null,
                book_condition || null,
                description || null,
                image || null,
                purchase_url || null,
                location || null,
                owner_id || null,
            ]
        );
        await connection.end();
        console.log('Book bookRes', bookRes);

        req.flash('success_msg', 'Book added successfully');
        res.redirect('/dashboard', { book: { title: 'meri achi book' } });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error adding book');
        res.redirect('/books/add');
    }
});

// Get all books
router.get('/', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [books] = await connection.execute(
            `SELECT books.*, users.name as owner_name
       FROM books
       JOIN users ON books.owner_id = users.id
       ORDER BY books.created_at DESC`
        );
        await connection.end();

        res.render('books/index', {
            books,
            user: req.session.user,
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error fetching books');
        res.redirect('/');
    }
});

// In your routes file (e.g., routes/books.js)
// router.get('/', async (req, res) => {
//     try {
//         let searchQuery = {};
//         const { location } = req.query; // Get location from query params

//         // If location parameter exists, filter by location
//         if (location) {
//             searchQuery.location = new RegExp(location, 'i'); // Case-insensitive search
//         }

//         // Fetch books with optional location filter
//         const books = await Book.find(searchQuery).sort({ createdAt: -1 }).limit(12);

//         // Get popular genres for the sidebar
//         const popularGenres = await Book.aggregate([
//             { $group: { _id: "$genre", count: { $sum: 1 } } },
//             { $sort: { count: -1 } },
//             { $limit: 5 }
//         ]);

//         res.render('books/index', {
//             books,
//             popularGenres: popularGenres.map(g => g._id),
//             searchLocation: location || ''
//         });

//     } catch (err) {
//         console.error(err);
//         res.status(500).send('Server Error');
//     }
// });

// Get book details by ID
router.get('/:id', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);

        // Get book details with owner information
        const [books] = await connection.execute(
            `SELECT books.*, users.name as owner_name, users.location as owner_location
       FROM books
       JOIN users ON books.owner_id = users.id
       WHERE books.id = ?`,
            [req.params.id]
        );

        if (books.length === 0) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/books');
        }

        const book = books[0];

        // Get book reviews if any
        const [reviews] = await connection.execute(
            `SELECT reviews.*, users.name as reviewer_name
       FROM reviews
       JOIN users ON reviews.reviewer_id = users.id
       WHERE book_id = ?
       ORDER BY created_at DESC`,
            [req.params.id]
        );

        await connection.end();

        // Check if current user is the owner
        const isOwner = req.session.user && req.session.user.id === book.owner_id;

        res.render('books/details', {
            book,
            reviews,
            isOwner,
            user: req.session.user,
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error fetching book details');
        res.redirect('/books');
    }
});

// Edit Book - GET
router.get('/:id/edit', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to edit a book');
        return res.redirect('/login');
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [book] = await connection.execute('SELECT * FROM books WHERE id = ?', [req.params.id]);
        await connection.end();

        if (book.length === 0) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/dashboard');
        }

        if (book[0].owner_id !== req.session.user.id) {
            req.flash('error_msg', 'You can only edit your own books');
            return res.redirect('/dashboard');
        }

        res.render('books/edit', { book: book[0] });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error retrieving book for editing');
        res.redirect('/dashboard');
    }
});

// Edit Book - POST
router.post('/:id/edit', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to edit a book');
        return res.redirect('/login');
    }

    const { title, author, genre, book_condition, description, image_url, purchase_url, location, status } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);

        // First check if the book belongs to the user
        const [book] = await connection.execute('SELECT * FROM books WHERE id = ?', [req.params.id]);

        if (book.length === 0) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/dashboard');
        }

        if (book[0].owner_id !== req.session.user.id) {
            req.flash('error_msg', 'You can only edit your own books');
            return res.redirect('/dashboard');
        }

        await connection.execute(
            'UPDATE books SET title = ?, author = ?, genre = ?, book_condition = ?, description = ?, image_url = ?, purchase_url = ?, location = ?, status = ? WHERE id = ?',
            [title, author, genre, book_condition, description, image_url, purchase_url, location, status, req.params.id]
        );
        await connection.end();

        req.flash('success_msg', 'Book updated successfully');
        res.redirect(`/books/${req.params.id}`);
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error updating book');
        res.redirect(`/books/${req.params.id}/edit`);
    }
});

// Delete Book
router.post('/:id/delete', async (req, res) => {
    if (!req.session.user) {
        req.flash('error_msg', 'Please log in to delete a book');
        return res.redirect('/login');
    }

    try {
        const connection = await mysql.createConnection(dbConfig);

        // First check if the book belongs to the user
        const [book] = await connection.execute('SELECT * FROM books WHERE id = ?', [req.params.id]);

        if (book.length === 0) {
            req.flash('error_msg', 'Book not found');
            return res.redirect('/dashboard');
        }

        if (book[0].owner_id !== req.session.user.id) {
            req.flash('error_msg', 'You can only delete your own books');
            return res.redirect('/dashboard');
        }

        await connection.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
        await connection.end();

        req.flash('success_msg', 'Book deleted successfully');
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error deleting book');
        res.redirect('/dashboard');
    }
});

// Search Books
router.get('/search', async (req, res) => {
    const { q, genre, location } = req.query;
    let query =
        'SELECT books.*, users.name as owner_name FROM books JOIN users ON books.owner_id = users.id WHERE books.status = "available"';
    const params = [];

    if (q) {
        query += ' AND (books.title LIKE ? OR books.author LIKE ?)';
        params.push(`%${q}%`, `%${q}%`);
    }

    if (genre) {
        query += ' AND books.genre = ?';
        params.push(genre);
    }

    if (location) {
        query += ' AND users.location LIKE ?';
        params.push(`%${location}%`);
    }

    query += ' ORDER BY books.created_at DESC';

    try {
        const connection = await mysql.createConnection(dbConfig);
        const [books] = await connection.execute(query, params);
        await connection.end();

        res.render('books/list', { books, searchQuery: { q, genre, location } });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error searching books');
        res.redirect('/');
    }
});

module.exports = router;
