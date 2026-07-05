const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/authController');
const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// ============================================================
// 1. ROUTE PUBLIC (TIDAK PERLU TOKEN)
// ============================================================

// Registrasi & Login
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Refresh Token
router.post('/refresh', AuthController.refresh);

// Forgot & Reset Password
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

// Guest Session
router.post('/guest-session', AuthController.createGuestSession);

// Email Verification
router.post('/verify-email', AuthController.verifyEmail);
router.post('/resend-verification', AuthController.resendVerification);

// Convert Guest to User
router.post('/convert-guest', AuthController.convertGuest);

// ============================================================
// 2. ROUTE AUTH PROTECTED (WAJIB LOGIN)
// ============================================================

// Profile (Auth)
router.get('/me', authMiddleware, AuthController.getProfile);

// Logout
router.post('/logout', authMiddleware, AuthController.logout);
router.post('/logout-all', authMiddleware, AuthController.logoutAll);

// ============================================================
// 3. ROUTE USER (WAJIB LOGIN)
// ============================================================

// --- Profile User ---
router.get('/profile', authMiddleware, UserController.getProfile);
router.put('/profile', authMiddleware, UserController.updateProfile);

// --- Change Password ---
router.put('/password', authMiddleware, UserController.changePassword);

// --- History & Notes ---
router.get('/history', authMiddleware, UserController.getHistory);
router.put('/history/:id/notes', authMiddleware, UserController.addNote);
router.delete('/history/:id', authMiddleware, UserController.deleteHistory);

// --- Favorites ---
router.get('/favorites', authMiddleware, UserController.getFavorites);
router.post('/favorites/:id', authMiddleware, UserController.addFavorite);
router.delete('/favorites/:id', authMiddleware, UserController.removeFavorite);

// --- Settings ---
router.get('/settings', authMiddleware, UserController.getSettings);
router.put('/settings', authMiddleware, UserController.updateSettings);

// --- Delete Account ---
router.delete('/account', authMiddleware, UserController.deleteAccount);

// ============================================================
// 4. ROUTE ADMIN (WAJIB LOGIN + ROLE ADMIN)
// ============================================================

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