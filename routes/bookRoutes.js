// routes/bookRoutes.js - Book management API routes
const express = require('express');
const router = express.Router();
const {
  getBooks,
  getBook,
  addBook,
  updateBook,
  deleteBook,
  getCategories,
  getBookStats,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const { validateBook } = require('../middleware/validate');

// Public routes
router.get('/', getBooks);
router.get('/categories', getCategories);
router.get('/:id', getBook);

// Protected routes - Admin and Librarian only
router.post('/', protect, authorize('admin', 'librarian'), validateBook, addBook);
router.put('/:id', protect, authorize('admin', 'librarian'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);
router.get('/admin/stats', protect, authorize('admin', 'librarian'), getBookStats);

module.exports = router;
