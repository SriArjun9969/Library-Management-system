// controllers/bookController.js - Full CRUD operations for books
const Book = require('../models/Book');

// @desc    Get all books with search, filter, and pagination
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const { search, category, page = 1, limit = 12, sort = '-createdAt', available } = req.query;

    // Build query object
    let query = { isActive: true };

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
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const total = await Book.countDocuments(query);
    const books = await Book.find(query).sort(sort).skip(skip).limit(limitNum);

    res.json({
      success: true,
      count: books.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      books,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new book
// @route   POST /api/books
// @access  Admin, Librarian
const addBook = async (req, res) => {
  try {
    // Set availableCopies = quantity when first adding
    if (!req.body.availableCopies) {
      req.body.availableCopies = req.body.quantity;
    }

    const book = await Book.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Book added successfully!',
      book,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A book with this ISBN already exists.' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update book details
// @route   PUT /api/books/:id
// @access  Admin, Librarian
const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // If quantity changed, adjust availableCopies accordingly
    if (req.body.quantity !== undefined && req.body.quantity !== book.quantity) {
      const issuedCount = book.quantity - book.availableCopies;
      req.body.availableCopies = Math.max(0, req.body.quantity - issuedCount);
    }

    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Book updated successfully!', book: updatedBook });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a book (soft delete)
// @route   DELETE /api/books/:id
// @access  Admin
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if any copies are currently issued
    if (book.availableCopies < book.quantity) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with active issued copies. Please wait for returns.',
      });
    }

    // Soft delete - mark as inactive
    book.isActive = false;
    await book.save();

    res.json({ success: true, message: 'Book deleted successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get book categories list
// @route   GET /api/books/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Book.distinct('category', { isActive: true });
    res.json({ success: true, categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get book statistics
// @route   GET /api/books/stats
// @access  Admin, Librarian
const getBookStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalCopies = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$quantity' }, available: { $sum: '$availableCopies' } } },
    ]);

    const categoryStats = await Book.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalBooks,
        totalCopies: totalCopies[0]?.total || 0,
        availableCopies: totalCopies[0]?.available || 0,
        issuedCopies: (totalCopies[0]?.total || 0) - (totalCopies[0]?.available || 0),
        categoryStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBooks, getBook, addBook, updateBook, deleteBook, getCategories, getBookStats };
