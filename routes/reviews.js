const express = require("express");
const router = express.Router();
const { db } = require("../models/db");
const Review = require("../models/Review");

// Add review - POST
router.post("/:bookId", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to leave a review");
    return res.redirect("/login");
  }

  try {
    const { rating, comment } = req.body;
    const bookId = req.params.bookId;
    const reviewerId = req.session.user.id;

    // Check if user has already reviewed this book
    const [existingReview] = await db.query(
      "SELECT * FROM reviews WHERE book_id = ? AND reviewer_id = ?",
      [bookId, reviewerId]
    );

    if (existingReview.length > 0) {
      req.flash("error_msg", "You have already reviewed this book");
      return res.redirect(`/books/${bookId}`);
    }

    // Check if user has actually exchanged this book
    const [exchange] = await db.query(
      `SELECT * FROM requests 
       JOIN books ON requests.book_id = books.id 
       WHERE books.id = ? 
         AND requests.requester_id = ? 
         AND requests.status = 'approved'`,
      [bookId, reviewerId]
    );

    if (exchange.length === 0) {
      req.flash("error_msg", "You can only review books you have exchanged");
      return res.redirect(`/books/${bookId}`);
    }

    // Create review
    await Review.create(bookId, reviewerId, rating, comment);

    req.flash("success_msg", "Review added successfully");
    res.redirect(`/books/${bookId}`);
  } catch (error) {
    console.error("Review error:", error);
    req.flash("error_msg", "Error adding review");
    res.redirect("back");
  }
});

// Delete review - POST
router.post("/:id/delete", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to delete reviews");
    return res.redirect("/login");
  }

  try {
    const reviewId = req.params.id;
    const userId = req.session.user.id;

    // Verify review ownership
    const [review] = await db.query(
      "SELECT * FROM reviews WHERE id = ? AND reviewer_id = ?",
      [reviewId, userId]
    );

    if (review.length === 0) {
      req.flash("error_msg", "Review not found or unauthorized");
      return res.redirect("back");
    }

    await Review.delete(reviewId);

    req.flash("success_msg", "Review deleted successfully");
    res.redirect(`/books/${review[0].book_id}`);
  } catch (error) {
    console.error("Delete review error:", error);
    req.flash("error_msg", "Error deleting review");
    res.redirect("back");
  }
});

module.exports = router;
