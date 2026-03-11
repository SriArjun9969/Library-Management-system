// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { getUsers, getUser, updateUser, updateProfile, toggleUserStatus } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'librarian'), getUsers);
router.get('/:id', protect, authorize('admin'), getUser);
router.put('/profile', protect, updateProfile);
router.put('/:id', protect, authorize('admin'), updateUser);
router.put('/:id/toggle', protect, authorize('admin'), toggleUserStatus);

module.exports = router;
