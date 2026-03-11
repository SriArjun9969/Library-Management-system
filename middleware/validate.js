// middleware/validate.js - Input validation rules using express-validator
const { body, validationResult } = require('express-validator');

// Middleware to check validation results
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// User registration validation rules
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please enter a valid phone number'),

  handleValidation,
];

// User login validation rules
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),

  body('password')
    .notEmpty().withMessage('Password is required'),

  handleValidation,
];

// Book validation rules
const validateBook = [
  body('title')
    .trim()
    .notEmpty().withMessage('Book title is required')
    .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),

  body('author')
    .trim()
    .notEmpty().withMessage('Author name is required'),

  body('isbn')
    .trim()
    .notEmpty().withMessage('ISBN is required'),

  body('category')
    .notEmpty().withMessage('Category is required'),

  body('quantity')
    .isInt({ min: 1 }).withMessage('Quantity must be a positive number'),

  body('publishedYear')
    .optional()
    .isInt({ min: 1000, max: new Date().getFullYear() })
    .withMessage('Please enter a valid published year'),

  handleValidation,
];

// Issue book validation
const validateIssue = [
  body('bookId')
    .notEmpty().withMessage('Book ID is required')
    .isMongoId().withMessage('Invalid Book ID'),

  body('userId')
    .notEmpty().withMessage('User ID is required')
    .isMongoId().withMessage('Invalid User ID'),

  handleValidation,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateBook,
  validateIssue,
  handleValidation,
};
