// public/js/app.js - Main application logic
// ─── State ────────────────────────────────────────────────────────────────────
const State = {
  user: null,
  currentSection: 'books',
  books: { list: [], total: 0, page: 1, totalPages: 1 },
  issues: { list: [], total: 0, page: 1, totalPages: 1 },
  users: { list: [], total: 0 },
  stats: {},
  filters: { search: '', category: '', available: '', page: 1 },
};

// ─── Toast Notifications ──────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span class="toast-msg">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isLoggedIn() { return !!localStorage.getItem('token'); }

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  State.user = null;
  showAuthView();
}

async function checkAuth() {
  if (!isLoggedIn()) { showAuthView(); return; }
  try {
    const res = await authAPI.getMe();
    State.user = res.user;
    showDashboard();
  } catch {
    localStorage.removeItem('token');
    showAuthView();
  }
}

function showAuthView() {
  document.getElementById('auth-view').style.display = 'flex';
  document.getElementById('app-view').style.display = 'none';
}

function showDashboard() {
  document.getElementById('auth-view').style.display = 'none';
  document.getElementById('app-view').style.display = 'flex';
  renderSidebar();
  navigateTo('dashboard');
}

// ─── Login / Register ─────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px"></span> Logging in...';

  try {
    const res = await authAPI.login({
      email: document.getElementById('login-email').value,
      password: document.getElementById('login-password').value,
    });
    localStorage.setItem('token', res.token);
    State.user = res.user;
    showToast(`Welcome back, ${res.user.name}! 🎉`);
    showDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = e.target.querySelector('button[type=submit]');
  btn.disabled = true;

  try {
    const res = await authAPI.register({
      name: document.getElementById('reg-name').value,
      email: document.getElementById('reg-email').value,
      password: document.getElementById('reg-password').value,
      phone: document.getElementById('reg-phone').value,
    });
    localStorage.setItem('token', res.token);
    State.user = res.user;
    showToast('Account created successfully! 🎉');
    showDashboard();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
function renderSidebar() {
  const user = State.user;
  if (!user) return;

  const isAdmin = user.role === 'admin';
  const isStaff = ['admin', 'librarian'].includes(user.role);

  const navItems = [
    { id: 'dashboard', icon: 'fa-th-large', label: 'Dashboard', show: true },
    { id: 'books', icon: 'fa-books', label: 'Browse Books', show: true },
    { id: 'my-books', icon: 'fa-book-reader', label: 'My Books', show: user.role === 'user' },
    { id: 'manage-books', icon: 'fa-book-medical', label: 'Manage Books', show: isStaff },
    { id: 'issue-return', icon: 'fa-exchange-alt', label: 'Issue / Return', show: isStaff },
    { id: 'overdue', icon: 'fa-clock', label: 'Overdue Books', show: isStaff },
    { id: 'users', icon: 'fa-users', label: 'Users', show: isStaff },
  ];

  document.getElementById('sidebar-nav').innerHTML = navItems
    .filter(n => n.show)
    .map(n => `
      <div class="nav-item ${State.currentSection === n.id ? 'active' : ''}" onclick="navigateTo('${n.id}')">
        <i class="fas ${n.icon}"></i> <span>${n.label}</span>
      </div>`).join('');

  // User info
  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  document.getElementById('sidebar-user-info').innerHTML = `
    <div class="sidebar-user">
      <div class="sidebar-avatar">${initials}</div>
      <div>
        <div style="font-size:.875rem;font-weight:600">${user.name}</div>
        <div style="font-size:.75rem;opacity:.6;text-transform:capitalize">${user.role}</div>
      </div>
    </div>
    <button class="btn btn-secondary btn-sm btn-full" onclick="logout()">
      <i class="fas fa-sign-out-alt"></i> Logout
    </button>`;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
function navigateTo(section) {
  State.currentSection = section;
  renderSidebar();

  const sectionTitles = {
    dashboard: 'Dashboard',
    books: 'Browse Books',
    'my-books': 'My Issued Books',
    'manage-books': 'Manage Books',
    'issue-return': 'Issue / Return Books',
    overdue: 'Overdue Books',
    users: 'Users Management',
  };

  document.getElementById('page-title').textContent = sectionTitles[section] || section;
  document.getElementById('page-content').innerHTML = '<div class="loading-wrap"><div class="spinner"></div><p>Loading...</p></div>';

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');

  const renders = {
    dashboard: renderDashboard,
    books: renderBooksPage,
    'my-books': renderMyBooks,
    'manage-books': renderManageBooks,
    'issue-return': renderIssueReturn,
    overdue: renderOverdue,
    users: renderUsers,
  };

  if (renders[section]) renders[section]();
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
async function renderDashboard() {
  const isStaff = ['admin', 'librarian'].includes(State.user.role);
  const content = document.getElementById('page-content');

  if (isStaff) {
    try {
      const statsRes = await issuesAPI.getStats();
      const s = statsRes.stats;
      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-books"></i></div><div><div class="stat-value">${s.totalBooks}</div><div class="stat-label">Total Books</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-users"></i></div><div><div class="stat-value">${s.totalUsers}</div><div class="stat-label">Registered Users</div></div></div>
          <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-book-open"></i></div><div><div class="stat-value">${s.totalIssued}</div><div class="stat-label">Books Issued</div></div></div>
          <div class="stat-card"><div class="stat-icon red"><i class="fas fa-exclamation-circle"></i></div><div><div class="stat-value">${s.totalOverdue}</div><div class="stat-label">Overdue Books</div></div></div>
          <div class="stat-card"><div class="stat-icon purple"><i class="fas fa-check-circle"></i></div><div><div class="stat-value">${s.totalReturned}</div><div class="stat-label">Books Returned</div></div></div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div class="card" id="recent-issues-card"><div class="card-header"><h3>Recent Issues</h3></div><div class="card-body" id="recent-issues">Loading...</div></div>
          <div class="card" id="recent-books-card"><div class="card-header"><h3>Recently Added Books</h3></div><div class="card-body" id="recent-books">Loading...</div></div>
        </div>`;

      // Load recent issues
      const issuesRes = await issuesAPI.getAll({ limit: 5 });
      const recentIssues = issuesRes.issuedBooks;
      document.getElementById('recent-issues').innerHTML = recentIssues.length
        ? recentIssues.map(i => `
            <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
              <div>
                <div style="font-weight:600;font-size:.875rem">${i.book?.title || 'N/A'}</div>
                <div style="font-size:.8rem;color:#6b7280">${i.user?.name || 'N/A'}</div>
              </div>
              <span class="badge ${i.status === 'returned' ? 'badge-success' : new Date() > new Date(i.dueDate) ? 'badge-danger' : 'badge-info'}">${new Date() > new Date(i.dueDate) && i.status !== 'returned' ? 'Overdue' : i.status}</span>
            </div>`).join('')
        : '<p style="color:#6b7280">No issues yet.</p>';

      // Load recent books
      const booksRes = await booksAPI.getAll({ limit: 5 });
      document.getElementById('recent-books').innerHTML = booksRes.books.map(b => `
        <div style="padding:10px 0;border-bottom:1px solid #f1f5f9;display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:600;font-size:.875rem">${b.title}</div>
            <div style="font-size:.8rem;color:#6b7280">${b.author}</div>
          </div>
          <span class="badge badge-info">${b.category}</span>
        </div>`).join('');
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading dashboard</h3><p>${err.message}</p></div>`;
    }
  } else {
    // User dashboard
    try {
      const issuesRes = await issuesAPI.getMy();
      const booksRes = await booksAPI.getAll({ limit: 4 });
      const issues = issuesRes.issuedBooks;
      const activeIssues = issues.filter(i => i.status === 'issued').length;

      content.innerHTML = `
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-icon blue"><i class="fas fa-book-reader"></i></div><div><div class="stat-value">${activeIssues}</div><div class="stat-label">Currently Issued</div></div></div>
          <div class="stat-card"><div class="stat-icon green"><i class="fas fa-history"></i></div><div><div class="stat-value">${issues.length}</div><div class="stat-label">Total Borrowed</div></div></div>
          <div class="stat-card"><div class="stat-icon orange"><i class="fas fa-id-card"></i></div><div><div class="stat-value" style="font-size:1.1rem">${State.user.membershipId || 'N/A'}</div><div class="stat-label">Membership ID</div></div></div>
        </div>
        <div class="card"><div class="card-header"><h3>Featured Books</h3><button class="btn btn-outline btn-sm" onclick="navigateTo('books')">View All</button></div>
        <div class="card-body"><div class="books-grid" id="featured-books">Loading...</div></div></div>`;

      renderBookCards(booksRes.books, 'featured-books');
    } catch (err) {
      content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>${err.message}</p></div>`;
    }
  }
}

// ─── Books Page ───────────────────────────────────────────────────────────────
async function renderBooksPage(page = 1) {
  const content = document.getElementById('page-content');

  // Get categories for filter
  let categoriesHTML = '<option value="">All Categories</option>';
  try {
    const catRes = await booksAPI.getCategories();
    categoriesHTML += catRes.categories.map(c => `<option value="${c}" ${State.filters.category === c ? 'selected' : ''}>${c}</option>`).join('');
  } catch {}

  content.innerHTML = `
    <div class="page-header">
      <div><h2>Browse Books</h2><p>Explore our collection of ${State.books.total || ''} books</p></div>
    </div>
    <div class="search-bar">
      <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" class="search-input" id="book-search" placeholder="Search by title, author, or ISBN..." value="${State.filters.search}" oninput="debounceSearch(this.value)"></div>
      <select class="form-select" style="width:180px" id="cat-filter" onchange="filterByCategory(this.value)">${categoriesHTML}</select>
      <select class="form-select" style="width:160px" onchange="filterByAvailable(this.value)">
        <option value="">All Books</option>
        <option value="true" ${State.filters.available === 'true' ? 'selected' : ''}>Available Only</option>
      </select>
    </div>
    <div id="books-grid" class="books-grid"><div class="loading-wrap"><div class="spinner"></div></div></div>
    <div id="books-pagination"></div>`;

  await loadBooks(page);
}

async function loadBooks(page = 1) {
  try {
    const res = await booksAPI.getAll({
      search: State.filters.search,
      category: State.filters.category,
      available: State.filters.available,
      page,
      limit: 12,
    });
    State.books = { list: res.books, total: res.total, page: res.currentPage, totalPages: res.totalPages };
    renderBookCards(res.books, 'books-grid');
    renderPagination('books-pagination', res.currentPage, res.totalPages, loadBooks);
  } catch (err) {
    document.getElementById('books-grid').innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error loading books</h3></div>`;
  }
}

let searchTimeout;
function debounceSearch(val) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => { State.filters.search = val; loadBooks(1); }, 400);
}
function filterByCategory(val) { State.filters.category = val; loadBooks(1); }
function filterByAvailable(val) { State.filters.available = val; loadBooks(1); }

const coverColors = [
  'linear-gradient(135deg,#667eea,#764ba2)',
  'linear-gradient(135deg,#f093fb,#f5576c)',
  'linear-gradient(135deg,#4facfe,#00f2fe)',
  'linear-gradient(135deg,#43e97b,#38f9d7)',
  'linear-gradient(135deg,#fa709a,#fee140)',
  'linear-gradient(135deg,#a18cd1,#fbc2eb)',
  'linear-gradient(135deg,#fccb90,#d57eeb)',
  'linear-gradient(135deg,#a1c4fd,#c2e9fb)',
];

function renderBookCards(books, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!books.length) {
    container.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-book-open"></i><h3>No books found</h3><p>Try adjusting your search or filters</p></div>';
    return;
  }
  const bookEmojis = ['📚', '📖', '📗', '📘', '📙', '📕'];
  container.innerHTML = books.map((b, i) => {
    const copies = b.availableCopies;
    const badgeClass = copies === 0 ? 'badge-unavailable' : copies <= 2 ? 'badge-limited' : 'badge-available';
    const badgeText = copies === 0 ? 'Unavailable' : copies <= 2 ? `${copies} left` : 'Available';
    const bgColor = coverColors[i % coverColors.length];
    const emoji = bookEmojis[i % bookEmojis.length];

    return `
      <div class="book-card" onclick="showBookDetail('${b._id}')">
        <div class="book-cover" style="background:${bgColor}">
          <span>${emoji}</span>
          <span class="book-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="book-info">
          <div class="book-category">${b.category}</div>
          <div class="book-title">${b.title}</div>
          <div class="book-author"><i class="fas fa-user-edit" style="font-size:.75rem;margin-right:4px"></i>${b.author}</div>
          <div class="book-meta">
            <span class="book-copies"><i class="fas fa-copy" style="font-size:.75rem;margin-right:4px"></i>${b.availableCopies}/${b.quantity} copies</span>
            ${b.publishedYear ? `<span style="font-size:.8rem;color:#9ca3af">${b.publishedYear}</span>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

// ─── Book Detail Modal ────────────────────────────────────────────────────────
async function showBookDetail(bookId) {
  try {
    const { book } = await booksAPI.getOne(bookId);
    const isUser = State.user.role === 'user';
    const isStaff = ['admin', 'librarian'].includes(State.user.role);
    const canIssue = book.availableCopies > 0;
    const bgColor = coverColors[Math.floor(Math.random() * coverColors.length)];

    const modalHTML = `
      <div class="modal-overlay" id="book-modal" onclick="if(event.target.id==='book-modal')closeModal('book-modal')">
        <div class="modal">
          <div class="modal-header">
            <h3>Book Details</h3>
            <button class="modal-close" onclick="closeModal('book-modal')"><i class="fas fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="book-detail-cover" style="background:${bgColor}">📚</div>
            <h2 style="font-size:1.3rem;font-weight:700;margin-bottom:4px">${book.title}</h2>
            <p style="color:#6b7280;margin-bottom:16px">by ${book.author}</p>
            ${book.description ? `<p style="color:#374151;margin-bottom:16px;line-height:1.6">${book.description}</p>` : ''}
            <div class="book-detail-info">
              <div class="book-detail-info-item"><label>ISBN</label><span>${book.isbn}</span></div>
              <div class="book-detail-info-item"><label>Category</label><span>${book.category}</span></div>
              <div class="book-detail-info-item"><label>Available</label><span>${book.availableCopies} / ${book.quantity}</span></div>
              ${book.publishedYear ? `<div class="book-detail-info-item"><label>Published</label><span>${book.publishedYear}</span></div>` : ''}
              ${book.publisher ? `<div class="book-detail-info-item"><label>Publisher</label><span>${book.publisher}</span></div>` : ''}
              ${book.pages ? `<div class="book-detail-info-item"><label>Pages</label><span>${book.pages}</span></div>` : ''}
              ${book.language ? `<div class="book-detail-info-item"><label>Language</label><span>${book.language}</span></div>` : ''}
              ${book.location ? `<div class="book-detail-info-item"><label>Location</label><span>${book.location}</span></div>` : ''}
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('book-modal')">Close</button>
            ${isUser && canIssue ? `<button class="btn btn-primary" onclick="requestIssue('${book._id}')"><i class="fas fa-book"></i> Issue This Book</button>` : ''}
            ${isUser && !canIssue ? `<button class="btn btn-secondary" disabled><i class="fas fa-times-circle"></i> Not Available</button>` : ''}
            ${isStaff ? `<button class="btn btn-outline" onclick="closeModal('book-modal');openEditBook('${book._id}')"><i class="fas fa-edit"></i> Edit</button>` : ''}
          </div>
        </div>
      </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function requestIssue(bookId) {
  closeModal('book-modal');
  try {
    const res = await issuesAPI.issue({ bookId });
    showToast(res.message);
    loadBooks();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

// ─── My Books (User) ──────────────────────────────────────────────────────────
async function renderMyBooks() {
  const content = document.getElementById('page-content');
  try {
    const { issuedBooks } = await issuesAPI.getMy();
    const active = issuedBooks.filter(i => i.status === 'issued');
    const history = issuedBooks.filter(i => i.status === 'returned');

    content.innerHTML = `
      <div class="page-header"><h2>My Issued Books</h2></div>
      <div class="card" style="margin-bottom:24px">
        <div class="card-header"><h3>Currently Issued (${active.length})</h3></div>
        <div class="card-body">
          ${active.length ? `
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>Author</th><th>Issue Date</th><th>Due Date</th><th>Status</th><th>Fine</th></tr></thead>
            <tbody>${active.map(i => {
              const isOverdue = new Date() > new Date(i.dueDate);
              const finePerDay = 5;
              const overdueDays = isOverdue ? Math.ceil((new Date() - new Date(i.dueDate)) / 86400000) : 0;
              const fine = overdueDays * finePerDay;
              return `<tr class="${isOverdue ? 'overdue' : ''}">
                <td><strong>${i.book?.title || 'N/A'}</strong></td>
                <td>${i.book?.author || 'N/A'}</td>
                <td>${new Date(i.issueDate).toLocaleDateString()}</td>
                <td>${new Date(i.dueDate).toLocaleDateString()}</td>
                <td>${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : '<span class="badge badge-info">Issued</span>'}</td>
                <td>${fine > 0 ? `<span style="color:#dc2626;font-weight:600">$${fine}</span>` : '-'}</td>
              </tr>`;}).join('')}
            </tbody>
          </table></div>` : '<div class="empty-state"><i class="fas fa-book-reader"></i><h3>No active issues</h3><p>You have no books currently issued.</p><button class="btn btn-primary" onclick="navigateTo(\'books\')">Browse Books</button></div>'}
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>History (${history.length})</h3></div>
        <div class="card-body">
          ${history.length ? `
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>Issue Date</th><th>Return Date</th><th>Fine Paid</th></tr></thead>
            <tbody>${history.map(i => `<tr>
              <td><strong>${i.book?.title || 'N/A'}</strong></td>
              <td>${new Date(i.issueDate).toLocaleDateString()}</td>
              <td>${i.returnDate ? new Date(i.returnDate).toLocaleDateString() : 'N/A'}</td>
              <td>${i.fine > 0 ? `$${i.fine}` : 'None'}</td>
            </tr>`).join('')}
            </tbody>
          </table></div>` : '<p style="color:#6b7280;text-align:center;padding:20px">No return history yet.</p>'}
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

// ─── Manage Books (Admin/Librarian) ───────────────────────────────────────────
async function renderManageBooks(page = 1) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header">
      <div><h2>Manage Books</h2></div>
      <button class="btn btn-primary" onclick="openAddBook()"><i class="fas fa-plus"></i> Add Book</button>
    </div>
    <div class="card">
      <div class="card-header">
        <div class="search-bar" style="margin-bottom:0">
          <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" class="search-input" id="manage-search" placeholder="Search books..." oninput="debounceManageSearch(this.value)"></div>
        </div>
      </div>
      <div class="card-body" id="manage-books-body"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>
    <div id="manage-pagination"></div>`;

  await loadManageBooks(1);
}

async function loadManageBooks(page = 1, search = '') {
  try {
    const res = await booksAPI.getAll({ page, limit: 10, search });
    document.getElementById('manage-books-body').innerHTML = res.books.length
      ? `<div class="table-wrapper"><table>
          <thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Category</th><th>Qty</th><th>Available</th><th>Actions</th></tr></thead>
          <tbody>${res.books.map(b => `<tr>
            <td><strong>${b.title}</strong></td>
            <td>${b.author}</td>
            <td style="font-size:.8rem;color:#6b7280">${b.isbn}</td>
            <td><span class="badge badge-info">${b.category}</span></td>
            <td>${b.quantity}</td>
            <td><span class="badge ${b.availableCopies > 0 ? 'badge-success' : 'badge-danger'}">${b.availableCopies}</span></td>
            <td>
              <button class="btn btn-sm btn-outline" onclick="openEditBook('${b._id}')"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="confirmDeleteBook('${b._id}','${b.title.replace(/'/g, '')}')"><i class="fas fa-trash"></i></button>
            </td>
          </tr>`).join('')}
          </tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-books"></i><h3>No books found</h3></div>';

    renderPagination('manage-pagination', res.currentPage, res.totalPages, loadManageBooks);
  } catch (err) {
    document.getElementById('manage-books-body').innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

let manageSearchTimeout;
function debounceManageSearch(val) {
  clearTimeout(manageSearchTimeout);
  manageSearchTimeout = setTimeout(() => loadManageBooks(1, val), 400);
}

function openAddBook() {
  const modal = `
    <div class="modal-overlay" id="book-form-modal" onclick="if(event.target.id==='book-form-modal')closeModal('book-form-modal')">
      <div class="modal">
        <div class="modal-header"><h3>Add New Book</h3><button class="modal-close" onclick="closeModal('book-form-modal')"><i class="fas fa-times"></i></button></div>
        <div class="modal-body">${bookFormHTML()}</div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('book-form-modal')">Cancel</button>
          <button class="btn btn-primary" onclick="submitBook()"><i class="fas fa-plus"></i> Add Book</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function openEditBook(bookId) {
  try {
    const { book } = await booksAPI.getOne(bookId);
    const modal = `
      <div class="modal-overlay" id="book-form-modal" onclick="if(event.target.id==='book-form-modal')closeModal('book-form-modal')">
        <div class="modal">
          <div class="modal-header"><h3>Edit Book</h3><button class="modal-close" onclick="closeModal('book-form-modal')"><i class="fas fa-times"></i></button></div>
          <div class="modal-body">${bookFormHTML(book)}</div>
          <div class="modal-footer">
            <button class="btn btn-secondary" onclick="closeModal('book-form-modal')">Cancel</button>
            <button class="btn btn-primary" onclick="submitBook('${bookId}')"><i class="fas fa-save"></i> Save Changes</button>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function bookFormHTML(book = {}) {
  const categories = ['Fiction','Non-Fiction','Science','Technology','History','Biography','Self-Help','Psychology','Philosophy','Mathematics','Literature','Arts','Reference','Other'];
  return `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Title *</label><input class="form-control" id="bf-title" value="${book.title || ''}" placeholder="Book title"></div>
      <div class="form-group"><label class="form-label">Author *</label><input class="form-control" id="bf-author" value="${book.author || ''}" placeholder="Author name"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">ISBN *</label><input class="form-control" id="bf-isbn" value="${book.isbn || ''}" placeholder="e.g. 9780743273565"></div>
      <div class="form-group"><label class="form-label">Category *</label>
        <select class="form-select" id="bf-category">
          ${categories.map(c => `<option value="${c}" ${book.category === c ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Total Quantity *</label><input class="form-control" id="bf-quantity" type="number" min="0" value="${book.quantity || 1}"></div>
      <div class="form-group"><label class="form-label">Published Year</label><input class="form-control" id="bf-year" type="number" value="${book.publishedYear || ''}" placeholder="e.g. 2024"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Publisher</label><input class="form-control" id="bf-publisher" value="${book.publisher || ''}" placeholder="Publisher name"></div>
      <div class="form-group"><label class="form-label">Pages</label><input class="form-control" id="bf-pages" type="number" value="${book.pages || ''}" placeholder="Number of pages"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Language</label><input class="form-control" id="bf-language" value="${book.language || 'English'}"></div>
      <div class="form-group"><label class="form-label">Location (Shelf)</label><input class="form-control" id="bf-location" value="${book.location || ''}" placeholder="e.g. Shelf A-1"></div>
    </div>
    <div class="form-group"><label class="form-label">Description</label><textarea class="form-control" id="bf-description" rows="3" placeholder="Book description">${book.description || ''}</textarea></div>`;
}

async function submitBook(bookId = null) {
  const data = {
    title: document.getElementById('bf-title').value.trim(),
    author: document.getElementById('bf-author').value.trim(),
    isbn: document.getElementById('bf-isbn').value.trim(),
    category: document.getElementById('bf-category').value,
    quantity: parseInt(document.getElementById('bf-quantity').value),
    publishedYear: document.getElementById('bf-year').value ? parseInt(document.getElementById('bf-year').value) : undefined,
    publisher: document.getElementById('bf-publisher').value.trim(),
    pages: document.getElementById('bf-pages').value ? parseInt(document.getElementById('bf-pages').value) : undefined,
    language: document.getElementById('bf-language').value.trim(),
    location: document.getElementById('bf-location').value.trim(),
    description: document.getElementById('bf-description').value.trim(),
  };

  if (!data.title || !data.author || !data.isbn) {
    showToast('Title, author, and ISBN are required.', 'error'); return;
  }

  try {
    if (bookId) {
      await booksAPI.update(bookId, data);
      showToast('Book updated successfully!');
    } else {
      await booksAPI.add(data);
      showToast('Book added successfully!');
    }
    closeModal('book-form-modal');
    loadManageBooks(1);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function confirmDeleteBook(bookId, title) {
  const modal = `
    <div class="modal-overlay" id="confirm-modal">
      <div class="modal" style="max-width:400px">
        <div class="modal-header"><h3>Confirm Delete</h3></div>
        <div class="modal-body"><p>Are you sure you want to delete <strong>"${title}"</strong>? This action cannot be undone.</p></div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('confirm-modal')">Cancel</button>
          <button class="btn btn-danger" onclick="deleteBook('${bookId}')"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', modal);
}

async function deleteBook(bookId) {
  try {
    await booksAPI.delete(bookId);
    showToast('Book deleted successfully.', 'warning');
    closeModal('confirm-modal');
    loadManageBooks(1);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Issue / Return ───────────────────────────────────────────────────────────
async function renderIssueReturn() {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px">
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-book" style="color:#4f46e5;margin-right:8px"></i>Issue a Book</h3></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">User ID or Email</label>
            <input class="form-control" id="issue-user-id" placeholder="Enter User ID"></div>
          <div class="form-group"><label class="form-label">Book ISBN or ID</label>
            <div style="display:flex;gap:8px">
              <input class="form-control" id="issue-book-id" placeholder="Enter Book ID or ISBN">
              <button class="btn btn-secondary btn-sm" onclick="searchBookForIssue()" style="white-space:nowrap"><i class="fas fa-search"></i></button>
            </div>
          </div>
          <div id="issue-book-preview" style="display:none;padding:12px;background:#f8fafc;border-radius:8px;margin-bottom:12px"></div>
          <button class="btn btn-primary btn-full" onclick="processIssue()"><i class="fas fa-book"></i> Issue Book</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3><i class="fas fa-undo" style="color:#22c55e;margin-right:8px"></i>Return a Book</h3></div>
        <div class="card-body">
          <div class="form-group"><label class="form-label">Issue Record ID</label>
            <input class="form-control" id="return-issue-id" placeholder="Enter Issue Record ID"></div>
          <div class="form-group"><label class="form-label">Remarks (Optional)</label>
            <textarea class="form-control" id="return-remarks" rows="2" placeholder="Any notes about the book condition..."></textarea></div>
          <button class="btn btn-success btn-full" onclick="processReturn()"><i class="fas fa-undo"></i> Process Return</button>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header"><h3>Active Issues</h3></div>
      <div class="card-body" id="active-issues-table"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>`;

  await loadActiveIssues();
}

async function loadActiveIssues() {
  try {
    const { issuedBooks } = await issuesAPI.getAll({ status: 'issued', limit: 20 });
    document.getElementById('active-issues-table').innerHTML = issuedBooks.length
      ? `<div class="table-wrapper"><table>
          <thead><tr><th>Issue ID</th><th>Book</th><th>User</th><th>Issue Date</th><th>Due Date</th><th>Status</th></tr></thead>
          <tbody>${issuedBooks.map(i => {
            const isOverdue = new Date() > new Date(i.dueDate);
            return `<tr class="${isOverdue ? 'overdue' : ''}">
              <td style="font-size:.75rem;font-family:monospace">${i._id}</td>
              <td><strong>${i.book?.title || 'N/A'}</strong><br><small style="color:#6b7280">${i.book?.isbn || ''}</small></td>
              <td>${i.user?.name || 'N/A'}<br><small style="color:#6b7280">${i.user?.membershipId || ''}</small></td>
              <td>${new Date(i.issueDate).toLocaleDateString()}</td>
              <td>${new Date(i.dueDate).toLocaleDateString()}</td>
              <td>${isOverdue ? '<span class="badge badge-danger">Overdue</span>' : '<span class="badge badge-info">Issued</span>'}</td>
            </tr>`;}).join('')}
          </tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-check-circle"></i><h3>No active issues</h3></div>';
  } catch (err) {
    document.getElementById('active-issues-table').innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

async function searchBookForIssue() {
  const val = document.getElementById('issue-book-id').value.trim();
  if (!val) return;
  try {
    const res = await booksAPI.getAll({ search: val, limit: 1 });
    if (res.books.length) {
      const b = res.books[0];
      document.getElementById('issue-book-id').value = b._id;
      document.getElementById('issue-book-preview').style.display = 'block';
      document.getElementById('issue-book-preview').innerHTML = `<strong>${b.title}</strong> by ${b.author} — <span class="${b.availableCopies > 0 ? 'badge badge-success' : 'badge badge-danger'}">${b.availableCopies} available</span>`;
    } else {
      showToast('Book not found', 'warning');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function processIssue() {
  const bookId = document.getElementById('issue-book-id').value.trim();
  const userId = document.getElementById('issue-user-id').value.trim();
  if (!bookId) { showToast('Book ID is required', 'error'); return; }

  try {
    const res = await issuesAPI.issue({ bookId, userId: userId || undefined });
    showToast(res.message);
    document.getElementById('issue-book-id').value = '';
    document.getElementById('issue-user-id').value = '';
    document.getElementById('issue-book-preview').style.display = 'none';
    loadActiveIssues();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function processReturn() {
  const issueId = document.getElementById('return-issue-id').value.trim();
  const remarks = document.getElementById('return-remarks').value.trim();
  if (!issueId) { showToast('Issue ID is required', 'error'); return; }

  try {
    const res = await issuesAPI.return(issueId, { remarks });
    showToast(res.message);
    document.getElementById('return-issue-id').value = '';
    document.getElementById('return-remarks').value = '';
    loadActiveIssues();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Overdue Books ────────────────────────────────────────────────────────────
async function renderOverdue() {
  const content = document.getElementById('page-content');
  try {
    const { overdueBooks } = await issuesAPI.getOverdue();
    const finePerDay = 5;

    content.innerHTML = `
      <div class="page-header">
        <div><h2>Overdue Books</h2><p>${overdueBooks.length} overdue book(s) found</p></div>
      </div>
      <div class="card">
        <div class="card-body">
          ${overdueBooks.length ? `
          <div class="table-wrapper"><table>
            <thead><tr><th>Book</th><th>User</th><th>Phone</th><th>Due Date</th><th>Days Overdue</th><th>Fine</th><th>Action</th></tr></thead>
            <tbody>${overdueBooks.map(i => {
              const overdueDays = Math.ceil((new Date() - new Date(i.dueDate)) / 86400000);
              const fine = overdueDays * finePerDay;
              return `<tr class="overdue">
                <td><strong>${i.book?.title || 'N/A'}</strong><br><small style="color:#6b7280">${i.book?.isbn || ''}</small></td>
                <td>${i.user?.name || 'N/A'}<br><small style="color:#6b7280">${i.user?.membershipId || ''}</small></td>
                <td>${i.user?.phone || '-'}</td>
                <td>${new Date(i.dueDate).toLocaleDateString()}</td>
                <td><span class="badge badge-danger">${overdueDays} days</span></td>
                <td><span style="color:#dc2626;font-weight:700">$${fine}</span></td>
                <td><button class="btn btn-sm btn-success" onclick="quickReturn('${i._id}')"><i class="fas fa-undo"></i> Return</button></td>
              </tr>`;}).join('')}
            </tbody>
          </table></div>` : '<div class="empty-state"><i class="fas fa-check-circle" style="color:#22c55e"></i><h3>No overdue books</h3><p>All issued books are on time!</p></div>'}
        </div>
      </div>`;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Error</h3><p>${err.message}</p></div>`;
  }
}

async function quickReturn(issueId) {
  try {
    const res = await issuesAPI.return(issueId, {});
    showToast(res.message);
    renderOverdue();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Users Management ─────────────────────────────────────────────────────────
async function renderUsers(page = 1) {
  const content = document.getElementById('page-content');
  content.innerHTML = `
    <div class="page-header"><div><h2>Users Management</h2></div></div>
    <div class="card">
      <div class="card-header">
        <div class="search-input-wrap"><i class="fas fa-search"></i><input type="text" class="search-input" id="user-search" placeholder="Search users..." oninput="debounceUserSearch(this.value)" style="width:300px"></div>
      </div>
      <div class="card-body" id="users-table"><div class="loading-wrap"><div class="spinner"></div></div></div>
    </div>
    <div id="users-pagination"></div>`;

  await loadUsers(1);
}

async function loadUsers(page = 1, search = '') {
  try {
    const res = await usersAPI.getAll({ page, limit: 10, search });
    document.getElementById('users-table').innerHTML = res.users.length
      ? `<div class="table-wrapper"><table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Membership ID</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>${res.users.map(u => `<tr>
            <td><strong>${u.name}</strong></td>
            <td>${u.email}</td>
            <td><span class="badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'librarian' ? 'badge-warning' : 'badge-info'}">${u.role}</span></td>
            <td>${u.membershipId || '-'}</td>
            <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-secondary'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
            <td>${new Date(u.createdAt).toLocaleDateString()}</td>
            <td>${State.user.role === 'admin' ? `<button class="btn btn-sm ${u.isActive ? 'btn-warning' : 'btn-success'}" onclick="toggleUser('${u._id}')"><i class="fas fa-${u.isActive ? 'ban' : 'check'}"></i></button>` : ''}</td>
          </tr>`).join('')}
          </tbody></table></div>`
      : '<div class="empty-state"><i class="fas fa-users"></i><h3>No users found</h3></div>';

    renderPagination('users-pagination', res.currentPage || page, Math.ceil(res.total / 10) || 1, loadUsers);
  } catch (err) {
    document.getElementById('users-table').innerHTML = `<p style="color:red">${err.message}</p>`;
  }
}

let userSearchTimeout;
function debounceUserSearch(val) {
  clearTimeout(userSearchTimeout);
  userSearchTimeout = setTimeout(() => loadUsers(1, val), 400);
}

async function toggleUser(userId) {
  try {
    const res = await usersAPI.toggle(userId);
    showToast(res.message);
    loadUsers(1);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function renderPagination(containerId, currentPage, totalPages, callback) {
  const container = document.getElementById(containerId);
  if (!container || totalPages <= 1) { if(container) container.innerHTML = ''; return; }

  let pages = '';
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      pages += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="(${callback.name})(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      pages += `<span style="padding:0 4px">...</span>`;
    }
  }

  container.innerHTML = `
    <div class="pagination">
      <button class="page-btn" onclick="(${callback.name})(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
      ${pages}
      <button class="page-btn" onclick="(${callback.name})(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
    </div>`;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Auth tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('login-form').style.display = target === 'login' ? 'block' : 'none';
      document.getElementById('register-form').style.display = target === 'register' ? 'block' : 'none';
    });
  });

  // Mobile sidebar toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // Sidebar overlay click
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });

  checkAuth();
});
