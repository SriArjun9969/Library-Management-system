# 📚 LibraryOS — Library Management System

A complete full-stack Library Management System built with **Node.js**, **Express**, **MongoDB**, and a modern dark-themed frontend using **HTML5 / CSS3 / Vanilla JS**.

---

## 🌟 Features

### Authentication & Roles
- JWT-based login & registration
- Password hashing with bcrypt
- Three roles: **Admin**, **Librarian**, **Student/User**
- Role-based access control on all routes

### Admin Features
- Add, edit, delete books
- View & manage all library members
- Issue books to members
- Process returns & calculate fines
- View overdue books with fine details
- Dashboard with real-time statistics
- Activate/deactivate user accounts

### Librarian Features
- Add & edit books
- Issue and return books
- View all issued & overdue books

### Student/User Features
- Register & login
- Browse all books with search & filters
- View book details
- See personal borrowing history
- Track overdue status & fines

### Book Management
- Full CRUD operations
- Category-based filtering
- Full-text search (title, author, ISBN)
- Auto-update available copies on issue/return
- Pagination

### Fine System
- Configurable fine per day (default: ₹5/day)
- Configurable loan period (default: 14 days)
- Fine tracking — paid/unpaid status

---

## 🛠️ Tech Stack

| Layer      | Technology                     |
|------------|--------------------------------|
| Backend    | Node.js + Express.js           |
| Database   | MongoDB + Mongoose ODM         |
| Auth       | JWT + bcryptjs                 |
| Validation | express-validator              |
| Frontend   | HTML5 + CSS3 + Vanilla JS      |
| Fonts      | Syne + DM Sans (Google Fonts)  |

---

## 📁 Project Structure

```
library-management-system/
├── config/
│   ├── db.js           # MongoDB connection
│   └── seed.js         # Sample data seeder
├── controllers/
│   ├── authController.js
│   ├── bookController.js
│   ├── issuedBookController.js
│   └── userController.js
├── middleware/
│   ├── auth.js         # JWT protect + authorize
│   ├── errorHandler.js # Global error handler
│   └── validate.js     # Input validation rules
├── models/
│   ├── User.js
│   ├── Book.js
│   └── IssuedBook.js
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── issuedBookRoutes.js
│   └── userRoutes.js
├── public/
│   └── index.html      # Full SPA frontend
├── .env
├── .env.example
├── package.json
├── server.js
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js** v18+ ([download](https://nodejs.org))
- **MongoDB** v6+ ([download](https://www.mongodb.com/try/download/community)) OR MongoDB Atlas (cloud)

### 1. Clone / Download

```bash
cd library-management-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your_super_secret_key_change_me
JWT_EXPIRE=7d
FINE_PER_DAY=5
LOAN_PERIOD_DAYS=14
```

> 💡 For MongoDB Atlas, use your connection string:
> `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/library_management`

### 4. Seed Sample Data

```bash
npm run seed
```

This creates 4 users, 12 books, and 2 sample issue records.

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Open in Browser

```
http://localhost:5000
```

---

## 🔑 Demo Credentials

| Role       | Email                | Password    |
|------------|----------------------|-------------|
| Admin      | admin@library.com    | password123 |
| Librarian  | bob@library.com      | password123 |
| Student    | john@student.com     | password123 |
| Student    | jane@student.com     | password123 |

---

## 📡 REST API Reference

### Authentication
| Method | Endpoint              | Access  | Description          |
|--------|----------------------|---------|----------------------|
| POST   | /api/auth/register   | Public  | Register new user    |
| POST   | /api/auth/login      | Public  | Login               |
| GET    | /api/auth/me         | Private | Get current user    |
| PUT    | /api/auth/profile    | Private | Update profile      |
| PUT    | /api/auth/change-password | Private | Change password |

### Books
| Method | Endpoint              | Access         | Description         |
|--------|----------------------|----------------|---------------------|
| GET    | /api/books           | Public         | Get all books       |
| GET    | /api/books/:id       | Public         | Get single book     |
| GET    | /api/books/categories| Public         | Get categories      |
| POST   | /api/books           | Admin/Librarian| Add book            |
| PUT    | /api/books/:id       | Admin/Librarian| Update book         |
| DELETE | /api/books/:id       | Admin          | Delete book         |
| GET    | /api/books/admin/stats| Admin/Librarian| Book statistics    |

### Issued Books
| Method | Endpoint                  | Access         | Description          |
|--------|--------------------------|----------------|----------------------|
| GET    | /api/issued              | Admin/Librarian| All issued books     |
| GET    | /api/issued/overdue      | Admin/Librarian| Overdue books        |
| GET    | /api/issued/stats        | Admin/Librarian| Dashboard stats      |
| GET    | /api/issued/my-books     | Private        | Current user's books |
| GET    | /api/issued/user/:userId | Admin/Librarian| User's issued books  |
| POST   | /api/issued              | Admin/Librarian| Issue a book         |
| PUT    | /api/issued/:id/return   | Admin/Librarian| Return a book        |
| PUT    | /api/issued/:id/pay-fine | Admin/Librarian| Mark fine as paid    |

### Users
| Method | Endpoint                     | Access | Description      |
|--------|------------------------------|--------|-----------------|
| GET    | /api/users                   | Admin/Librarian | Get all users |
| GET    | /api/users/:id               | Admin/Librarian | Get user      |
| POST   | /api/users                   | Admin  | Create user     |
| PUT    | /api/users/:id               | Admin  | Update user     |
| PUT    | /api/users/:id/toggle-status | Admin  | Activate/deactivate |
| DELETE | /api/users/:id               | Admin  | Delete user     |

---

## 🔍 API Query Parameters

**GET /api/books**
- `search` — Search title, author, ISBN
- `category` — Filter by category
- `page` — Page number (default: 1)
- `limit` — Items per page (default: 12)
- `sort` — Sort field (default: -createdAt)
- `available=true` — Only show available books

**GET /api/issued**
- `status` — Filter: `issued`, `overdue`, `returned`
- `page`, `limit`

**GET /api/users**
- `search` — Search name, email, membershipId
- `role` — Filter: `admin`, `librarian`, `user`
- `page`, `limit`

---

## 💡 Configuration

| Variable       | Default | Description                |
|---------------|---------|----------------------------|
| PORT           | 5000    | Server port                |
| MONGO_URI      | —       | MongoDB connection string  |
| JWT_SECRET     | —       | JWT signing secret         |
| JWT_EXPIRE     | 7d      | Token expiry               |
| FINE_PER_DAY   | 5       | Fine in ₹ per overdue day  |
| LOAN_PERIOD_DAYS | 14   | Default loan duration      |

---

## 📌 Notes

- Books are **soft deleted** (marked inactive) to preserve historical records
- Overdue status is **auto-synced** when fetching issued books
- Users with unpaid fines **cannot borrow** new books
- A user **cannot borrow the same book** twice simultaneously
- Fine is **automatically calculated** at 0 if returned on time

---

## 📄 License

MIT License — Free to use for educational and personal projects.
