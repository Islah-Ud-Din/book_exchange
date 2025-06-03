const express = require("express");
const router = express.Router();
const { db } = require("../models/db");
const Wishlist = require("../models/Wishlist");

// View wishlist
router.get("/", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view your wishlist");
    return res.redirect("/login");
  }

  try {
    const userId = req.session.user.id;
    const wishlistItems = await Wishlist.getByUser(userId);
    res.render("wishlist/list", { wishlistItems });
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

  res.render("wishlist/add");
});

// Add to wishlist - POST
router.post("/add", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to add to wishlist");
    return res.redirect("/login");
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
