// config/seed.js - Seed database with sample data
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

// Import Models
const User = require('../models/User');
const Book = require('../models/Book');
const IssuedBook = require('../models/IssuedBook');

const seedData = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Book.deleteMany({});
  await IssuedBook.deleteMany({});

  console.log('🗑️  Cleared existing data');

  // Create Users (password will be hashed by the pre-save hook)
  const adminPassword = await bcrypt.hash('password123', 10);

  const users = await User.insertMany([
    {
      name: 'Admin User',
      email: 'admin@library.com',
      password: adminPassword,
      role: 'admin',
      phone: '1234567890',
      address: '123 Admin Street',
    },
    {
      name: 'John Student',
      email: 'john@student.com',
      password: adminPassword,
      role: 'user',
      phone: '9876543210',
      address: '456 Student Ave',
      membershipId: 'MEM0001',
    },
    {
      name: 'Jane Doe',
      email: 'jane@student.com',
      password: adminPassword,
      role: 'user',
      phone: '5551234567',
      address: '789 Library Road',
      membershipId: 'MEM0002',
    },
    {
      name: 'Librarian Bob',
      email: 'bob@library.com',
      password: adminPassword,
      role: 'librarian',
      phone: '4449876543',
      address: '321 Library Lane',
    },
  ]);

  console.log('👤 Users seeded');

  // Create Books
  const books = await Book.insertMany([
    {
      title: 'The Great Gatsby',
      author: 'F. Scott Fitzgerald',
      isbn: '9780743273565',
      category: 'Fiction',
      quantity: 5,
      availableCopies: 5,
      publishedYear: 1925,
      description: 'A story of the mysteriously wealthy Jay Gatsby and his love for Daisy Buchanan.',
      publisher: 'Scribner',
      language: 'English',
      pages: 180,
      location: 'Shelf A-1',
    },
    {
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      isbn: '9780061935466',
      category: 'Fiction',
      quantity: 4,
      availableCopies: 4,
      publishedYear: 1960,
      description: 'A novel about racial injustice and moral growth in the American South.',
      publisher: 'HarperCollins',
      language: 'English',
      pages: 336,
      location: 'Shelf A-2',
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      isbn: '9780132350884',
      category: 'Technology',
      quantity: 6,
      availableCopies: 6,
      publishedYear: 2008,
      description: 'A handbook of agile software craftsmanship.',
      publisher: 'Prentice Hall',
      language: 'English',
      pages: 431,
      location: 'Shelf B-1',
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'Andrew Hunt, David Thomas',
      isbn: '9780135957059',
      category: 'Technology',
      quantity: 3,
      availableCopies: 3,
      publishedYear: 2019,
      description: 'Your journey to mastery in software development.',
      publisher: 'Addison-Wesley',
      language: 'English',
      pages: 352,
      location: 'Shelf B-2',
    },
    {
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      isbn: '9780062316097',
      category: 'History',
      quantity: 7,
      availableCopies: 7,
      publishedYear: 2011,
      description: 'A survey of human history from the Stone Age to the 21st century.',
      publisher: 'Harper',
      language: 'English',
      pages: 443,
      location: 'Shelf C-1',
    },
    {
      title: 'Thinking, Fast and Slow',
      author: 'Daniel Kahneman',
      isbn: '9780374533557',
      category: 'Psychology',
      quantity: 4,
      availableCopies: 4,
      publishedYear: 2011,
      description: 'Explores the two systems that drive the way we think.',
      publisher: 'Farrar, Straus and Giroux',
      language: 'English',
      pages: 499,
      location: 'Shelf D-1',
    },
    {
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      isbn: '9780062315007',
      category: 'Fiction',
      quantity: 8,
      availableCopies: 8,
      publishedYear: 1988,
      description: 'A philosophical novel about a young Andalusian shepherd.',
      publisher: 'HarperOne',
      language: 'English',
      pages: 208,
      location: 'Shelf A-3',
    },
    {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      isbn: '9780262033848',
      category: 'Technology',
      quantity: 5,
      availableCopies: 5,
      publishedYear: 2009,
      description: 'Comprehensive textbook covering a broad range of algorithms.',
      publisher: 'MIT Press',
      language: 'English',
      pages: 1292,
      location: 'Shelf B-3',
    },
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      isbn: '9780735211292',
      category: 'Self-Help',
      quantity: 6,
      availableCopies: 6,
      publishedYear: 2018,
      description: 'How to build good habits and break bad ones.',
      publisher: 'Avery',
      language: 'English',
      pages: 320,
      location: 'Shelf E-1',
    },
    {
      title: 'A Brief History of Time',
      author: 'Stephen Hawking',
      isbn: '9780553380163',
      category: 'Science',
      quantity: 4,
      availableCopies: 4,
      publishedYear: 1988,
      description: 'From the Big Bang to Black Holes.',
      publisher: 'Bantam Books',
      language: 'English',
      pages: 212,
      location: 'Shelf F-1',
    },
    {
      title: 'The 7 Habits of Highly Effective People',
      author: 'Stephen R. Covey',
      isbn: '9780743269513',
      category: 'Self-Help',
      quantity: 5,
      availableCopies: 5,
      publishedYear: 1989,
      description: 'Powerful lessons in personal change.',
      publisher: 'Free Press',
      language: 'English',
      pages: 381,
      location: 'Shelf E-2',
    },
    {
      title: 'Rich Dad Poor Dad',
      author: 'Robert T. Kiyosaki',
      isbn: '9781612680194',
      category: 'Business',
      quantity: 6,
      availableCopies: 6,
      publishedYear: 1997,
      description: 'What the rich teach their kids about money.',
      publisher: 'Plata Publishing',
      language: 'English',
      pages: 336,
      location: 'Shelf G-1',
    },
  ]);

  console.log('📚 Books seeded');

  // Create sample issued books
  const overdueDate = new Date();
  overdueDate.setDate(overdueDate.getDate() - 20); // 20 days ago

  const dueDate = new Date(overdueDate);
  dueDate.setDate(dueDate.getDate() + 14); // Due 14 days from issue (now overdue)

  await IssuedBook.create({
    book: books[0]._id,
    user: users[1]._id,
    issueDate: overdueDate,
    dueDate: dueDate,
    status: 'overdue',
    issuedBy: users[0]._id,
  });

  await Book.findByIdAndUpdate(books[0]._id, { $inc: { availableCopies: -1 } });

  // Create a currently issued book (not overdue)
  const recentIssueDate = new Date();
  recentIssueDate.setDate(recentIssueDate.getDate() - 3); // 3 days ago
  const recentDueDate = new Date(recentIssueDate);
  recentDueDate.setDate(recentDueDate.getDate() + 14);

  await IssuedBook.create({
    book: books[2]._id,
    user: users[2]._id,
    issueDate: recentIssueDate,
    dueDate: recentDueDate,
    status: 'issued',
    issuedBy: users[3]._id,
  });

  await Book.findByIdAndUpdate(books[2]._id, { $inc: { availableCopies: -1 } });

  console.log('📋 Sample issued books created');
  console.log('\n✅ Database seeded successfully!');
  console.log('\n📧 Sample Login Credentials:');
  console.log('   Admin:     admin@library.com  / password123');
  console.log('   Librarian: bob@library.com    / password123');
  console.log('   User:      john@student.com   / password123');
  console.log('   User:      jane@student.com   / password123');

  process.exit(0);
};

seedData().catch((err) => {
  console.error(err);
  process.exit(1);
});
