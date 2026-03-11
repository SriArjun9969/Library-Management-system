// controllers/issueController.js - Book issuance and return logic
const IssuedBook = require('../models/IssuedBook');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Issue a book to a user
// @route   POST /api/issues
// @access  Private (Admin/Librarian or User requesting own issue)
exports.issueBook = async (req, res, next) => {
  try {
    const { bookId, userId } = req.body;
    const issueDuration = parseInt(process.env.ISSUE_DURATION_DAYS) || 14;

    // Determine target user
    const targetUserId = (req.user.role === 'admin' || req.user.role === 'librarian') && userId
      ? userId
      : req.user._id;

    // Check book availability
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found.' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available.' });
    }

    // Check if user already has this book issued
    const existingIssue = await IssuedBook.findOne({
      book: bookId,
      user: targetUserId,
      status: 'issued',
    });
    if (existingIssue) {
      return res.status(400).json({ success: false, message: 'User already has this book issued.' });
    }

    // Check user issue limit (max 3 books at a time)
    const activeIssues = await IssuedBook.countDocuments({ user: targetUserId, status: 'issued' });
    if (activeIssues >= 3) {
      return res.status(400).json({ success: false, message: 'Issue limit reached (max 3 books).' });
    }

    // Calculate due date
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + issueDuration);

    // Create issue record
    const issuedBook = await IssuedBook.create({
      book: bookId,
      user: targetUserId,
      issueDate,
      dueDate,
      issuedBy: req.user._id,
    });

    // Decrement available copies
    await Book.findByIdAndUpdate(bookId, { $inc: { availableCopies: -1 } });

    // Populate for response
    const populated = await IssuedBook.findById(issuedBook._id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email membershipId');

    res.status(201).json({
      success: true,
      message: `Book issued successfully. Due date: ${dueDate.toDateString()}`,
      issuedBook: populated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Return a book
// @route   PUT /api/issues/:id/return
// @access  Private (Admin/Librarian)
exports.returnBook = async (req, res, next) => {
  try {
    const issuedBook = await IssuedBook.findById(req.params.id);
    if (!issuedBook) {
      return res.status(404).json({ success: false, message: 'Issue record not found.' });
    }
    if (issuedBook.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book already returned.' });
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate fine if overdue
    if (returnDate > issuedBook.dueDate) {
      const finePerDay = parseInt(process.env.FINE_PER_DAY) || 5;
      const overdueDays = Math.ceil((returnDate - issuedBook.dueDate) / (1000 * 60 * 60 * 24));
      fine = overdueDays * finePerDay;
    }

    // Update issue record
    issuedBook.status = 'returned';
    issuedBook.returnDate = returnDate;
    issuedBook.fine = fine;
    issuedBook.returnedTo = req.user._id;
    issuedBook.remarks = req.body.remarks || '';
    await issuedBook.save();

    // Increment available copies
    await Book.findByIdAndUpdate(issuedBook.book, { $inc: { availableCopies: 1 } });

    // Update user's total fine
    if (fine > 0) {
      await User.findByIdAndUpdate(issuedBook.user, { $inc: { totalFine: fine } });
    }

    res.json({
      success: true,
      message: fine > 0 ? `Book returned. Fine: $${fine}` : 'Book returned successfully!',
      fine,
      issuedBook,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all issued books (Admin/Librarian)
// @route   GET /api/issues
// @access  Private (Admin/Librarian)
exports.getAllIssuedBooks = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await IssuedBook.countDocuments(query);

    const issuedBooks = await IssuedBook.find(query)
      .populate('book', 'title author isbn category')
      .populate('user', 'name email membershipId phone')
      .populate('issuedBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: issuedBooks.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      issuedBooks,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get issued books for current user
// @route   GET /api/issues/my
// @access  Private
exports.getMyIssuedBooks = async (req, res, next) => {
  try {
    const issuedBooks = await IssuedBook.find({ user: req.user._id })
      .populate('book', 'title author isbn category coverImage')
      .sort('-createdAt');

    res.json({ success: true, issuedBooks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get overdue books
// @route   GET /api/issues/overdue
// @access  Private (Admin/Librarian)
exports.getOverdueBooks = async (req, res, next) => {
  try {
    const overdueBooks = await IssuedBook.find({
      status: 'issued',
      dueDate: { $lt: new Date() },
    })
      .populate('book', 'title author isbn')
      .populate('user', 'name email membershipId phone')
      .sort('dueDate');

    res.json({ success: true, count: overdueBooks.length, overdueBooks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/issues/stats
// @access  Private (Admin/Librarian)
exports.getStats = async (req, res, next) => {
  try {
    const totalBooks = await Book.countDocuments({ isActive: true });
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalIssued = await IssuedBook.countDocuments({ status: 'issued' });
    const totalOverdue = await IssuedBook.countDocuments({
      status: 'issued',
      dueDate: { $lt: new Date() },
    });
    const totalReturned = await IssuedBook.countDocuments({ status: 'returned' });

    res.json({
      success: true,
      stats: { totalBooks, totalUsers, totalIssued, totalOverdue, totalReturned },
    });
  } catch (error) {
    next(error);
  }
};
