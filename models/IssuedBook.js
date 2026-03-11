// models/IssuedBook.js - Tracks book issuance, returns, and fines
const mongoose = require('mongoose');

const issuedBookSchema = new mongoose.Schema(
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
      amount: {
        type: Number,
        default: 0,
      },
      paid: {
        type: Boolean,
        default: false,
      },
      paidDate: {
        type: Date,
      },
    },
    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or Librarian who issued the book
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin or Librarian who processed the return
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual to check if overdue
issuedBookSchema.virtual('isOverdue').get(function () {
  if (this.status === 'returned') return false;
  return new Date() > this.dueDate;
});

// Virtual to calculate current fine
issuedBookSchema.virtual('calculatedFine').get(function () {
  if (this.status === 'returned') return this.fine.amount;
  if (!this.isOverdue) return 0;
  const finePerDay = parseInt(process.env.FINE_PER_DAY) || 5;
  const overdueDays = Math.floor(
    (new Date() - this.dueDate) / (1000 * 60 * 60 * 24)
  );
  return overdueDays * finePerDay;
});

issuedBookSchema.set('toJSON', { virtuals: true });
issuedBookSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('IssuedBook', issuedBookSchema);
