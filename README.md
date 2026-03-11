# 📚 Library Management System

A full-stack web application for managing library operations with role-based access control, JWT authentication, and a modern responsive UI.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (Responsive) |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcryptjs |
| Validation | express-validator |

---

## ✨ Features

### 👤 User Roles
- **Admin** — Full system access
- **Librarian** — Book & issue management
- **Student/User** — Browse, request, return books

### 🔐 Authentication
- Registration & Login with password hashing (bcrypt)
- JWT-based stateless authentication
- Role-based route authorization middleware

### 📖 Book Management
- Add, edit, delete (soft-delete) books
- Auto-update available copies on issue/return
- Search by title, author, or ISBN
- Filter by category and availability
- Pagination for book listing

### 📋 Issue / Return
- Issue books to users (with 14-day default due date)
- Return processing with automatic fine calculation
- Maximum 3 active books per user
- Overdue tracking and fine calculation ($5/day default)

### 🛠 Admin Features
- Dashboard with live statistics
- View all issued and overdue books
- Manage users (activate/deactivate)
- Full CRUD for books

---

## 📁 Folder Structure

```
library-management-system/
├── config/
│   ├── db.js              # MongoDB connection
│   └── seed.js            # Sample data seeder
├── controllers/
│   ├── authController.js  # Login, register, profile
│   ├── bookController.js  # Book CRUD
│   ├── issueController.js # Issue & return logic
│   └── userController.js  # User management
├── middleware/
│   ├── auth.js            # JWT protect + authorize
│   ├── errorHandler.js    # Global error handler
│   └── validate.js        # express-validator rules
├── models/
│   ├── User.js            # User schema
│   ├── Book.js            # Book schema
│   └── IssuedBook.js      # Issue record schema
├── routes/
│   ├── authRoutes.js
│   ├── bookRoutes.js
│   ├── issueRoutes.js
│   └── userRoutes.js
├── public/
│   ├── css/style.css      # All styles
│   ├── js/
│   │   ├── api.js         # API communication layer
│   │   └── app.js         # Frontend SPA logic
│   └── index.html         # Single-page application
├── .env                   # Environment variables
├── .env.example           # Template
├── package.json
└── server.js              # App entry point
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v16+
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Step 1: Clone and install

```bash
# Navigate into the project
cd library-management-system

# Install dependencies
npm install
```

### Step 2: Configure environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your values
nano .env
```

**.env variables:**
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/library_management
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
FINE_PER_DAY=5
ISSUE_DURATION_DAYS=14
```

### Step 3: Seed the database (optional but recommended)

```bash
npm run seed
```

This will create:
- 4 sample users (admin, librarian, 2 students)
- 10 sample books across categories
- 1 sample issued book (overdue)

### Step 4: Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### Step 5: Open in browser

```
http://localhost:5000
```

---

## 🔑 Default Login Credentials

After seeding, use these to log in:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@library.com | password123 |
| Librarian | bob@library.com | password123 |
| Student | john@student.com | password123 |
| Student | jane@student.com | password123 |

---

## 🌐 API Reference

### Auth Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | /api/auth/register | Register new user | Public |
| POST | /api/auth/login | Login | Public |
| GET | /api/auth/me | Get current user | Private |
| PUT | /api/auth/password | Update password | Private |

### Books Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/books | Get all books (search, filter, paginate) | Public |
| GET | /api/books/:id | Get single book | Public |
| GET | /api/books/categories | Get all categories | Public |
| POST | /api/books | Add a book | Admin/Librarian |
| PUT | /api/books/:id | Update a book | Admin/Librarian |
| DELETE | /api/books/:id | Delete a book | Admin |

### Issues Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/issues | All issued books | Admin/Librarian |
| GET | /api/issues/my | My issued books | Private |
| GET | /api/issues/overdue | Overdue books | Admin/Librarian |
| GET | /api/issues/stats | Dashboard stats | Admin/Librarian |
| POST | /api/issues | Issue a book | Private |
| PUT | /api/issues/:id/return | Return a book | Admin/Librarian |

### Users Routes
| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | /api/users | Get all users | Admin/Librarian |
| GET | /api/users/:id | Get user by ID | Admin |
| PUT | /api/users/profile | Update own profile | Private |
| PUT | /api/users/:id | Update user | Admin |
| PUT | /api/users/:id/toggle | Toggle active status | Admin |

---

## 🗄️ MongoDB Schemas

### User Schema
```js
{ name, email, password (hashed), role, phone, address, membershipId, isActive, totalFine }
```

### Book Schema
```js
{ title, author, isbn, category, quantity, availableCopies, publishedYear, publisher, description, language, pages, location, isActive }
```

### IssuedBook Schema
```js
{ book (ref), user (ref), issueDate, dueDate, returnDate, status, fine, issuedBy (ref), remarks }
```

---

## 🎨 UI Pages

- **Login / Register** — Auth page with tabbed interface
- **Dashboard** — Stats cards + recent activity
- **Browse Books** — Grid with search, filter, pagination
- **My Books** (User) — Active issues + history
- **Manage Books** (Staff) — Table with edit/delete
- **Issue/Return** (Staff) — Issue book form + return form
- **Overdue Books** (Staff) — Overdue list with fine info
- **Users** (Admin/Librarian) — User management table

---

## 🔧 Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 5000 | Server port |
| FINE_PER_DAY | 5 | Fine amount per day overdue |
| ISSUE_DURATION_DAYS | 14 | Default borrowing period |
| JWT_EXPIRE | 7d | Token expiry |

---

## 📦 Dependencies

```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT authentication",
  "express-validator": "Input validation",
  "cors": "Cross-origin resource sharing",
  "dotenv": "Environment variables",
  "morgan": "HTTP request logging"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License — feel free to use for learning and personal projects.
