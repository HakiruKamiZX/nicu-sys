// This file manages the connection to the MySQL database.
require('dotenv').config(); // Loads environment variables from .env file
const mysql = require('mysql2/promise');

// Create a connection pool. This is more efficient than creating a single connection
// for every query, as it reuses connections.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// A simple function to test the connection.
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to the MySQL database.');
    connection.release();
  } catch (error) {
    console.error('Error connecting to the database:', error);
  }
}

// Run the connection test when the app starts.
testConnection();

// Export the pool so it can be used in our server.js file to run queries.
module.exports = pool;
