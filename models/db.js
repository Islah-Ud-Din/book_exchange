const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
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
    console.log("✅ Connected to the database! 2");
    connection.release(); // Release the connection back to the pool
  } catch (err) {
    console.error("❌ Database connection failed:", err.message);
  }
}

// Run the connection test
testDatabaseConnection();

// Export both pool and config
module.exports = {
  db: pool,
  dbConfig,
};
