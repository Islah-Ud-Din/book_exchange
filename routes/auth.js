const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { db } = require("../models/db");
const { findById, findBooksByUserId } = require("../models/Book");

// Register - GET
router.get("/register", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("auth/register");
});

// Register - POST
router.post("/register", async (req, res) => {
  const { name, email, password, password2, location } = req.body;

  // Validation
  if (password !== password2) {
    req.flash("error_msg", "Passwords do not match");
    return res.redirect("/register");
  }

  try {
    // Check if user exists
    const userExists = await User.findByEmail(email);
    if (userExists) {
      req.flash("error_msg", "Email is already registered");
      return res.redirect("/register");
    }

    // Create user
    const userId = await User.create(name, email, password, location);

    // Log user in
    const [user] = await db.query(
      "SELECT id, name, email, location FROM users WHERE id = ?",
      [userId]
    );
    req.session.user = user[0];
    req.flash("success_msg", "You are now registered and logged in");
    console.log("success_msg", "You are now registered and logged in");

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Registration error:", error);
    req.flash("error_msg", "Registration failed");
    res.redirect("/register");
  }
});

// Login - GET
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login");
});

// Login - POST
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findByEmail(email);
    if (!user) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    // Check password
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      req.flash("error_msg", "Invalid credentials");
      return res.redirect("/login");
    }

    // Log user in
    req.session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      location: user.location,
    };
    req.flash("success_msg", "You are now logged in");
    res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    req.flash("error_msg", "Login failed");
    res.redirect("/login");
  }
});

// Logout
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

// Profile - GET
router.get("/profile", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view profile");
    return res.redirect("/login");
  }

  try {
    const [user] = await db.query(
      "SELECT id, name, email, location FROM users WHERE id = ?",
      [req.session.user.id]
    );
    res.render("auth/profile", { user: user[0] });
  } catch (error) {
    console.error("Profile error:", error);
    req.flash("error_msg", "Error retrieving profile");
    res.redirect("/dashboard");
  }
});

// Profile - GET
router.get("/dashboard", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to view profile");
    return res.redirect("/login");
  }

  console.log("req.session.user", req.session.user);

  const booksData = await findBooksByUserId(req.session.user.id);

  try {
    res.render("dashboard", {
      user: req.session.user,
      // books: [],
      books: booksData,
      // {book: {title: "meri achi book", status: "ss", author: "author", genre: "bich"}}
      // books: [
      //   {
      //     title: "meri achi book",
      //     status: "ss",
      //     author: "author",
      //     genre: "bich",
      //   },
      // ],
      incomingRequests: [],
      outgoingRequests: [],
      wishlistItems: [],
      unreadMessages: 0,
    });
  } catch (error) {
    console.error("Profile error:", error);
    req.flash("error_msg", "Error retrieving profile");
    res.redirect("/login");
  }
});

// Profile - POST
router.post("/profile", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to update profile");
    return res.redirect("/login");
  }

  const { name, location } = req.body;

  try {
    await User.updateProfile(req.session.user.id, name, location);

    // Update session
    req.session.user.name = name;
    req.session.user.location = location;

    req.flash("success_msg", "Profile updated successfully");
    res.redirect("/profile");
  } catch (error) {
    console.error("Profile update error:", error);
    req.flash("error_msg", "Error updating profile");
    res.redirect("/profile");
  }
});

// Change Password - POST
router.post("/change-password", async (req, res) => {
  if (!req.session.user) {
    req.flash("error_msg", "Please log in to change password");
    return res.redirect("/login");
  }

  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    req.flash("error_msg", "New passwords do not match");
    return res.redirect("/profile");
  }

  try {
    // Verify current password
    const user = await User.findByEmail(req.session.user.email);
    const isMatch = await User.comparePassword(currentPassword, user.password);

    if (!isMatch) {
      req.flash("error_msg", "Current password is incorrect");
      return res.redirect("/profile");
    }

    // Update password
    await User.changePassword(user.id, newPassword);
    req.flash("success_msg", "Password changed successfully");
    res.redirect("/profile");
  } catch (error) {
    console.error("Password change error:", error);
    req.flash("error_msg", "Error changing password");
    res.redirect("/profile");
  }
});

module.exports = router;
