// const db = require("./db");
const bcryptjs = require("bcryptjs");
const { db } = require("./db");
const bcrypt = require("bcryptjs/dist/bcrypt");

class User {
  static async findByEmail(email) {
    console.log("called findByEmail");

    const [rows] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    return rows[0];
  }

  static async create(name, email, password, location) {
    const hashedPassword = await bcryptjs.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (name, email, password, location) VALUES (?, ?, ?, ?)",
      [name, email, hashedPassword, location]
    );
    return result.insertId;
  }

  static async comparePassword(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }

  static async updateProfile(userId, name, location) {
    await db.query("UPDATE users SET name = ?, location = ? WHERE id = ?", [
      name,
      location,
      userId,
    ]);
  }

  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);
  }
}

module.exports = User;
