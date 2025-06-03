const express = require("express");
const router = express.Router();
const { db } = require("../models/db");
const Wishlist = require("../models/Wishlist");

// Demo wishlist data
const demoWishlistItems = [
  {
    id: 1,
    user_id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    created_at: new Date()
  },
  {
    id: 2,
    user_id: 1,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Fiction",
    created_at: new Date(Date.now() - 86400000) // Yesterday
  },
  {
    id: 3,
    user_id: 1,
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    created_at: new Date(Date.now() - 172800000) // 2 days ago
  }
];

// View wishlist
router.get("/", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view your wishlist");
    return res.redirect("/login");
  }

  // Return demo data in development mode
  if (process.env.NODE_ENV === "development") {
    return res.render("wishlist/list", { 
      wishlistItems: demoWishlistItems,
      demoMode: true // Pass a flag to indicate demo mode to the view
    });
  }

  try {
    const userId = req.session.user.id;
    const wishlistItems = await Wishlist.getByUser(userId);
    res.render("wishlist/list", { wishlistItems, demoMode: false });
  } catch (error) {
    console.error("Wishlist error:", error);
    req.flash("error_msg", "Error retrieving wishlist");
    res.redirect("/dashboard");
  }
});

// Add to wishlist - GET
router.get("/add", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to add to wishlist");
    return res.redirect("/login");
  }

  res.render("wishlist/add", { demoMode: process.env.NODE_ENV === "development" });
});

// Add to wishlist - POST
router.post("/add", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to add to wishlist");
    return res.redirect("/login");
  }

  // In demo mode, just redirect with success message
  if (process.env.NODE_ENV === "development") {
    req.flash("success_msg", "[DEMO] Book added to wishlist");
    return res.redirect("/wishlist");
  }

  try {
    const { title, author, genre } = req.body;
    const userId = req.session.user.id;

    await Wishlist.create(userId, title, author, genre);

    req.flash("success_msg", "Book added to wishlist");
    res.redirect("/wishlist");
  } catch (error) {
    console.error("Add to wishlist error:", error);
    req.flash("error_msg", "Error adding to wishlist");
    res.redirect("/wishlist/add");
  }
});

// Remove from wishlist
router.post("/:id/delete", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to modify wishlist");
    return res.redirect("/login");
  }

  // In demo mode, just redirect with success message
  if (process.env.NODE_ENV === "development") {
    req.flash("success_msg", "[DEMO] Book removed from wishlist");
    return res.redirect("/wishlist");
  }

  try {
    const wishlistId = req.params.id;
    const userId = req.session.user.id;

    // Verify ownership
    const [item] = await db.query(
      "SELECT * FROM wishlist WHERE id = ? AND user_id = ?",
      [wishlistId, userId]
    );

    if (!item.length) {
      req.flash("error_msg", "Wishlist item not found");
      return res.redirect("/wishlist");
    }

    await Wishlist.delete(wishlistId);

    req.flash("success_msg", "Book removed from wishlist");
    res.redirect("/wishlist");
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    req.flash("error_msg", "Error removing from wishlist");
    res.redirect("/wishlist");
  }
});

module.exports = router;