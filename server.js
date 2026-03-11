// server.js - Main Express application entry point
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Connect to MongoDB
connectDB();

// ===== Middleware =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logging (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ===== API Routes =====
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/issued', require('./routes/issuedBookRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// API health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '📚 Library Management System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ===== Serve Frontend Pages =====
// All non-API routes serve the frontend HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Global Error Handler (must be last) =====
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📖 Library Management System`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
  console.log(`🔌 API:  http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
