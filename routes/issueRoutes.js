// routes/issueRoutes.js
const express = require('express');
const router = express.Router();
const {
  issueBook, returnBook, getAllIssuedBooks, getMyIssuedBooks, getOverdueBooks, getStats,
} = require('../controllers/issueController');
const { protect, authorize } = require('../middleware/auth');
const { validateIssue, handleValidationErrors } = require('../middleware/validate');

router.get('/stats', protect, authorize('admin', 'librarian'), getStats);
router.get('/overdue', protect, authorize('admin', 'librarian'), getOverdueBooks);
router.get('/my', protect, getMyIssuedBooks);
router.get('/', protect, authorize('admin', 'librarian'), getAllIssuedBooks);
router.post('/', protect, validateIssue, handleValidationErrors, issueBook);
router.put('/:id/return', protect, authorize('admin', 'librarian'), returnBook);

module.exports = router;
