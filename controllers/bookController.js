// controllers/bookController.js - Book CRUD operations
const Book = require('../models/Book');

// @desc    Get all books with search, filter, and pagination
// @route   GET /api/books
// @access  Public
exports.getBooks = async (req, res, next) => {
  try {
    const {
      search,
      category,
      available,
      page = 1,
      limit = 12,
      sort = '-createdAt',
    } = req.query;

    const query = { isActive: true };

    // Search by title, author, or ISBN
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { isbn: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    }

    // Filter by availability
    if (available === 'true') {
      query.availableCopies = { $gt: 0 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Book.countDocuments(query);

    const books = await Book.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: books.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      books,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    res.json({ success: true, book });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new book
// @route   POST /api/books
// @access  Private (Admin/Librarian)
exports.addBook = async (req, res, next) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({ success: true, message: 'Book added successfully!', book });
  } catch (error) {
    next(error);
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Private (Admin/Librarian)
exports.updateBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    // If updating quantity, adjust available copies proportionally
    if (req.body.quantity !== undefined) {
      const diff = req.body.quantity - book.quantity;
      req.body.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Book updated successfully!', book: updatedBook });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete book (soft delete)
// @route   DELETE /api/books/:id
// @access  Private (Admin)
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }

    await Book.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ success: true, message: 'Book deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all categories
// @route   GET /api/books/categories
// @access  Public
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Book.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (error) {
    next(error);
  }
};
