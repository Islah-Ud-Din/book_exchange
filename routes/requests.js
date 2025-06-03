const express = require("express");
const router = express.Router();
const { db } = require("../models/db");
const Request = require("../models/Request");
const Message = require("../models/Message");

// Create request
router.post("/", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to request a book");
    return res.redirect("/login");
  }

  try {
    const { book_id, message } = req.body;
    const requester_id = req.session.user.id;

    // Check if book exists and is available
    const [book] = await db.query(
      'SELECT * FROM books WHERE id = ? AND status = "available"',
      [book_id]
    );
    if (!book.length) {
      req.flash("error_msg", "Book not available for exchange");
      return res.redirect("back");
    }

    // Check if user already requested this book
    const [existingRequest] = await db.query(
      "SELECT * FROM requests WHERE book_id = ? AND requester_id = ?",
      [book_id, requester_id]
    );

    if (existingRequest.length) {
      req.flash("error_msg", "You already requested this book");
      return res.redirect("back");
    }

    // Create request
    const requestId = await Request.create(book_id, requester_id, message);

    // Create initial message
    await Message.createInitialMessage(
      requestId,
      requester_id,
      book[0].owner_id,
      message
    );

    req.flash("success_msg", "Book request sent successfully");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Request error:", error);
    req.flash("error_msg", "Error creating book request");
    res.redirect("back");
  }
});

// Update request status
router.post("/:id/status", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const { status } = req.body;
    const requestId = req.params.id;
    const userId = req.session.user.id;

    // Verify user owns the book in the request
    const [request] = await db.query(
      `SELECT requests.*, books.owner_id 
       FROM requests 
       JOIN books ON requests.book_id = books.id 
       WHERE requests.id = ?`,
      [requestId]
    );

    if (!request.length) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    if (request[0].owner_id !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    // Update request status
    await Request.updateStatus(requestId, status);

    // If approved, mark book as reserved
    if (status === "approved") {
      await db.query('UPDATE books SET status = "reserved" WHERE id = ?', [
        request[0].book_id,
      ]);
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Status update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// View request details
router.get("/:id", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view request details");
    return res.redirect("/login");
  }

  try {
    const requestId = req.params.id;
    const userId = req.session.user.id;

    const request = await Request.getDetails(requestId, userId);

    if (!request) {
      req.flash("error_msg", "Request not found");
      return res.redirect("/dashboard");
    }

    res.render("requests/view", { request });
  } catch (error) {
    console.error("Request details error:", error);
    req.flash("error_msg", "Error retrieving request details");
    res.redirect("/dashboard");
  }
});

module.exports = router;
