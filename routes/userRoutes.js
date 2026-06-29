// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');

// ============================================================
// SEMUA ROUTE USER WAJIB LOGIN (authMiddleware)
// ============================================================

// Profile
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);
router.put('/password', authMiddleware, UserController.changePassword);

// History
router.get('/history', authMiddleware, UserController.getHistory);

// Favorites
router.get('/favorites', authMiddleware, UserController.getFavorites);
router.post('/favorites/:id', authMiddleware, UserController.addFavorite);
router.delete('/favorites/:id', authMiddleware, UserController.removeFavorite);

// Settings
router.get('/settings', authMiddleware, UserController.getSettings);
router.put('/settings', authMiddleware, UserController.updateSettings);

module.exports = router;