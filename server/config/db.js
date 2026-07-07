/*
  CONFIG/DB.JS — MongoDB Connection
  ──────────────────────────────────
  This file handles the database connection.
  We export a function called connectDB() that
  index.js calls once when the server starts.

  Mongoose is the library that lets us:
  - Connect to MongoDB
  - Define data schemas (like a table structure)
  - Run queries in a clean JavaScript way
*/

const mongoose = require('mongoose')

const connectDB = async () => {
  try {
    // mongoose.connect() returns a promise
    // we await it so we know when it's done
    const conn = await mongoose.connect(process.env.MONGO_URI)

    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`)
    // Exit the process if DB connection fails
    // No point running a server with no database
    process.exit(1)
  }
}

module.exports = connectDB
