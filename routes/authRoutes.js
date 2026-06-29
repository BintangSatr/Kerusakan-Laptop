// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin'); // <-- IMPORT MIDDLEWARE ADMIN

// ================================================
// ROUTE PUBLIC
// ================================================
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/guest-session', AuthController.createGuestSession);

// ================================================
// ROUTE PROTECTED (WAJIB LOGIN)
// ================================================
router.get('/me', authMiddleware, AuthController.getProfile);

// ================================================
// ROUTE ADMIN (WAJIB LOGIN + ROLE ADMIN)
// ================================================
// TEST ENDPOINT: Cek apakah user adalah admin
router.get('/admin-check', authMiddleware, adminMiddleware, (req, res) => {
    res.json({
        message: '✅ Anda adalah admin!',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;