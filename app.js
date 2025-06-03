require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2/promise");
const path = require("path");
const bcrypt = require("bcryptjs");
const bodyParser = require("body-parser");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");

// Initialize Express
const app = express();

// Security Middleware
app.use(helmet());

app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "Arh@mali123",
  database: process.env.DB_NAME || "book_exchange",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Connected to the database!");
    connection.release();
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

// Run the connection test
testDatabaseConnection();

// Middleware
app.use(bodyParser.urlencoded({ extended: true, limit: "10kb" }));
app.use(bodyParser.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-here",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    },
  })
);
app.use(flash());

// CSRF Protection
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Global variables
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.user = req.session.user || null;

  next();
});

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "public/uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: Images only!"));
  },
}).single("image");

// Routes
const indexRoutes = require("./routes/index");
const authRoutes = require("./routes/auth");
const bookRoutes = require("./routes/books");
const requestRoutes = require("./routes/requests");
const messageRoutes = require("./routes/messages");
const wishlistRoutes = require("./routes/wishlist");
const reviewRoutes = require("./routes/reviews");

app.use("/", indexRoutes);
app.use("/", authRoutes);
app.use("/books", bookRoutes);
app.use("/requests", requestRoutes);
app.use("/messages", messageRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/reviews", reviewRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);

  // Handle file upload errors
  if (err instanceof multer.MulterError) {
    req.flash("error_msg", "File upload error: " + err.message);
    return res.redirect("back");
  } else if (err) {
    req.flash("error_msg", err.message);
    return res.redirect("back");
  }

  res.status(500).render("error", {
    message: "Something went wrong!",
    status: 500,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render("error", {
    message: "Page not found",
    status: 404,
  });
});

const PORT = process.env.PORT || 3001;
app
  .listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  })
  .on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log(`❌ Port ${PORT} is busy, trying ${PORT + 1}...`);
      app.listen(PORT + 1);
    } else {
      console.error("Server error:", err);
    }
  });

// Export for testing
module.exports = app;
