// controllers/issuedBookController.js - Issue, return, and track books
const IssuedBook = require('../models/IssuedBook');
const Book = require('../models/Book');
const User = require('../models/User');

const FINE_PER_DAY = parseInt(process.env.FINE_PER_DAY) || 5;
const LOAN_PERIOD_DAYS = parseInt(process.env.LOAN_PERIOD_DAYS) || 14;

// @desc    Issue a book to a user
// @route   POST /api/issued
// @access  Admin, Librarian
const issueBook = async (req, res) => {
  try {
    const { bookId, userId, notes } = req.body;

    // Validate book exists and has available copies
    const book = await Book.findById(bookId);
    if (!book || !book.isActive) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    if (book.availableCopies <= 0) {
      return res.status(400).json({ success: false, message: 'No copies available for this book' });
    }

    // Validate user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user already has this book issued
    const existingIssue = await IssuedBook.findOne({
      book: bookId,
      user: userId,
      status: 'issued',
    });
    if (existingIssue) {
      return res.status(400).json({
        success: false,
        message: 'User already has this book issued',
      });
    }

    // Check if user has unpaid fines
    const unpaidFines = await IssuedBook.findOne({
      user: userId,
      'fine.paid': false,
      'fine.amount': { $gt: 0 },
    });
    if (unpaidFines) {
      return res.status(400).json({
        success: false,
        message: 'User has unpaid fines. Please clear dues before issuing new books.',
      });
    }

    // Calculate due date
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS);

    // Create issued record
    const issuedBook = await IssuedBook.create({
      book: bookId,
      user: userId,
      dueDate,
      issuedBy: req.user._id,
      notes,
    });

    // Decrement available copies
    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1, totalIssued: 1 },
    });

    // Update user's total issued count
    await User.findByIdAndUpdate(userId, { $inc: { totalBooksIssued: 1 } });

    // Populate and return
    const populatedIssue = await IssuedBook.findById(issuedBook._id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email membershipId')
      .populate('issuedBy', 'name');

    res.status(201).json({
      success: true,
      message: `Book issued successfully! Due date: ${dueDate.toDateString()}`,
      issuedBook: populatedIssue,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Return an issued book
// @route   PUT /api/issued/:id/return
// @access  Admin, Librarian
const returnBook = async (req, res) => {
  try {
    const issuedBook = await IssuedBook.findById(req.params.id);

    if (!issuedBook) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }
    if (issuedBook.status === 'returned') {
      return res.status(400).json({ success: false, message: 'Book has already been returned' });
    }

    // Calculate fine if overdue
    let fineAmount = 0;
    const returnDate = new Date();
    if (returnDate > issuedBook.dueDate) {
      const overdueDays = Math.floor(
        (returnDate - issuedBook.dueDate) / (1000 * 60 * 60 * 24)
      );
      fineAmount = overdueDays * FINE_PER_DAY;
    }

    // Update issued record
    issuedBook.status = 'returned';
    issuedBook.returnDate = returnDate;
    issuedBook.returnedBy = req.user._id;
    issuedBook.fine.amount = fineAmount;
    issuedBook.fine.paid = fineAmount === 0; // Auto-mark as paid if no fine
    if (fineAmount === 0) issuedBook.fine.paidDate = returnDate;
    await issuedBook.save();

    // Increment available copies
    await Book.findByIdAndUpdate(issuedBook.book, {
      $inc: { availableCopies: 1 },
    });

    const populatedIssue = await IssuedBook.findById(issuedBook._id)
      .populate('book', 'title author isbn')
      .populate('user', 'name email membershipId');

    res.json({
      success: true,
      message: fineAmount > 0
        ? `Book returned. Fine of ₹${fineAmount} is pending.`
        : 'Book returned successfully! No fine.',
      issuedBook: populatedIssue,
      fine: fineAmount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pay fine for a returned book
// @route   PUT /api/issued/:id/pay-fine
// @access  Admin, Librarian
const payFine = async (req, res) => {
  try {
    const issuedBook = await IssuedBook.findById(req.params.id);

    if (!issuedBook) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }
    if (issuedBook.fine.paid) {
      return res.status(400).json({ success: false, message: 'Fine already paid' });
    }

    issuedBook.fine.paid = true;
    issuedBook.fine.paidDate = new Date();
    await issuedBook.save();

    // Update user's total fines paid
    await User.findByIdAndUpdate(issuedBook.user, {
      $inc: { totalFinesPaid: issuedBook.fine.amount },
    });

    res.json({
      success: true,
      message: `Fine of ₹${issuedBook.fine.amount} marked as paid.`,
      issuedBook,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all issued books (with filters)
// @route   GET /api/issued
// @access  Admin, Librarian
const getAllIssuedBooks = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    let query = {};
    if (status) query.status = status;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Update overdue status
    await IssuedBook.updateMany(
      { status: 'issued', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const total = await IssuedBook.countDocuments(query);
    const issuedBooks = await IssuedBook.find(query)
      .populate('book', 'title author isbn category')
      .populate('user', 'name email membershipId phone')
      .populate('issuedBy', 'name')
      .sort('-issueDate')
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      count: issuedBooks.length,
      total,
      pages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      issuedBooks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get issued books for a specific user
// @route   GET /api/issued/user/:userId
// @access  Admin, Librarian, or the user themselves
const getUserIssuedBooks = async (req, res) => {
  try {
    const userId = req.params.userId || req.user._id;

    // Regular users can only see their own history
    if (req.user.role === 'user' && userId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Sync overdue status for this user
    await IssuedBook.updateMany(
      { user: userId, status: 'issued', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const issuedBooks = await IssuedBook.find({ user: userId })
      .populate('book', 'title author isbn category coverImage')
      .sort('-issueDate');

    res.json({ success: true, count: issuedBooks.length, issuedBooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get overdue books
// @route   GET /api/issued/overdue
// @access  Admin, Librarian
const getOverdueBooks = async (req, res) => {
  try {
    // Update statuses first
    await IssuedBook.updateMany(
      { status: 'issued', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const overdueBooks = await IssuedBook.find({ status: 'overdue' })
      .populate('book', 'title author isbn')
      .populate('user', 'name email membershipId phone')
      .sort('dueDate');

    // Add calculated fine to each record
    const booksWithFines = overdueBooks.map((record) => {
      const overdueDays = Math.floor(
        (new Date() - record.dueDate) / (1000 * 60 * 60 * 24)
      );
      const fine = overdueDays * FINE_PER_DAY;
      return { ...record.toObject(), overdueDays, currentFine: fine };
    });

    res.json({
      success: true,
      count: booksWithFines.length,
      issuedBooks: booksWithFines,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/issued/stats
// @access  Admin, Librarian
const getStats = async (req, res) => {
  try {
    await IssuedBook.updateMany(
      { status: 'issued', dueDate: { $lt: new Date() } },
      { status: 'overdue' }
    );

    const [totalIssued, totalReturned, totalOverdue, totalUsers, unpaidFines] = await Promise.all([
      IssuedBook.countDocuments({ status: { $in: ['issued', 'overdue'] } }),
      IssuedBook.countDocuments({ status: 'returned' }),
      IssuedBook.countDocuments({ status: 'overdue' }),
      User.countDocuments({ role: 'user', isActive: true }),
      IssuedBook.aggregate([
        { $match: { 'fine.paid': false, 'fine.amount': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$fine.amount' } } },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalIssued,
        totalReturned,
        totalOverdue,
        totalUsers,
        unpaidFines: unpaidFines[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  issueBook,
  returnBook,
  payFine,
  getAllIssuedBooks,
  getUserIssuedBooks,
  getOverdueBooks,
  getStats,
};
