// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const {
  getBooks, getBook, addBook, updateBook, deleteBook, getCategories,
} = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/auth');
const { validateBook, handleValidationErrors } = require('../middleware/validate');

router.get('/categories', getCategories);
router.get('/', getBooks);
router.get('/:id', getBook);
router.post('/', protect, authorize('admin', 'librarian'), validateBook, handleValidationErrors, addBook);
router.put('/:id', protect, authorize('admin', 'librarian'), updateBook);
router.delete('/:id', protect, authorize('admin'), deleteBook);

module.exports = router;
