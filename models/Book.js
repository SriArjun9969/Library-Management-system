// models/Book.js - Book schema with all required fields
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true,
    },
    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Fiction',
        'Non-Fiction',
        'Science',
        'Technology',
        'History',
        'Biography',
        'Self-Help',
        'Psychology',
        'Philosophy',
        'Arts',
        'Mathematics',
        'Medicine',
        'Law',
        'Business',
        'Other',
      ],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      min: [0, 'Available copies cannot be negative'],
      default: function () {
        return this.quantity;
      },
    },
    publishedYear: {
      type: Number,
      min: [1000, 'Invalid year'],
      max: [new Date().getFullYear(), 'Year cannot be in the future'],
    },
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    publisher: {
      type: String,
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
    },
    pages: {
      type: Number,
      min: [1, 'Pages must be at least 1'],
    },
    location: {
      type: String,
      trim: true, // e.g., "Shelf A-1"
    },
    coverImage: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalIssued: {
      type: Number,
      default: 0, // Track how many times this book has been issued
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search functionality
bookSchema.index({ title: 'text', author: 'text', isbn: 'text' });

module.exports = mongoose.model('Book', bookSchema);
