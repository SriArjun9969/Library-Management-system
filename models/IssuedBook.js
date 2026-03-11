// models/IssuedBook.js - Track issued books
const mongoose = require('mongoose');

const IssuedBookSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book reference is required'],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['issued', 'returned', 'overdue'],
      default: 'issued',
    },
    fine: {
      type: Number,
      default: 0, // Fine amount calculated on return
    },
    finePaid: {
      type: Boolean,
      default: false,
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or librarian who issued the book
    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or librarian who accepted the return
    },
    remarks: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual: Check if book is overdue
IssuedBookSchema.virtual('isOverdue').get(function () {
  if (this.status === 'returned') return false;
  return new Date() > this.dueDate;
});

// Virtual: Calculate current fine
IssuedBookSchema.virtual('currentFine').get(function () {
  if (this.status === 'returned') return this.fine;
  if (!this.isOverdue) return 0;
  const finePerDay = parseInt(process.env.FINE_PER_DAY) || 5;
  const overdueDays = Math.ceil((new Date() - this.dueDate) / (1000 * 60 * 60 * 24));
  return overdueDays * finePerDay;
});

// Enable virtuals in JSON
IssuedBookSchema.set('toJSON', { virtuals: true });
IssuedBookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('IssuedBook', IssuedBookSchema);
