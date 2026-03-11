// routes/issuedBookRoutes.js - Book issuance and return API routes
const express = require('express');
const router = express.Router();
const {
  issueBook,
  returnBook,
  payFine,
  getAllIssuedBooks,
  getUserIssuedBooks,
  getOverdueBooks,
  getStats,
} = require('../controllers/issuedBookController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User routes
router.get('/my-books', getUserIssuedBooks); // Current user's books

// Admin/Librarian routes
router.get('/', authorize('admin', 'librarian'), getAllIssuedBooks);
router.get('/overdue', authorize('admin', 'librarian'), getOverdueBooks);
router.get('/stats', authorize('admin', 'librarian'), getStats);
router.get('/user/:userId', authorize('admin', 'librarian'), getUserIssuedBooks);
router.post('/', authorize('admin', 'librarian'), issueBook);
router.put('/:id/return', authorize('admin', 'librarian'), returnBook);
router.put('/:id/pay-fine', authorize('admin', 'librarian'), payFine);

module.exports = router;
