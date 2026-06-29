// controllers/authController.js
const AuthService = require('../services/authService');

const AuthController = {
    register: async (req, res) => {
        try {
            const { username, email, password, full_name } = req.body;
            if (!username || !email || !password || !full_name) {
                return res.status(400).json({ error: 'Semua field wajib diisi!' });
            }
            const result = await AuthService.register({ username, email, password, full_name });
            res.status(201).json(result);
        } catch (error) {
            console.error('Register error:', error.message);
            res.status(400).json({ error: error.message });
        }
    },

    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({ error: 'Email dan password wajib diisi!' });
            }
            const result = await AuthService.login(email, password);
            res.json(result);
        } catch (error) {
            console.error('Login error:', error.message);
            res.status(401).json({ error: error.message });
        }
    },
    
    getProfile: async (req, res) => {
        try {
            // req.user sudah diisi oleh middleware dari token
            // Kita ambil data lengkap dari database biar akurat
            const userId = req.user.id;
            const user = await AuthService.getProfile(userId);
            
            res.json({
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                is_active: user.is_active,
                created_at: user.created_at
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    createGuestSession: async (req, res) => {
        try {
            const AuthService = require('../services/authService');
            const guestSession = await AuthService.createGuestSession();
            res.status(201).json(guestSession);
        } catch (error) {
            console.error('Guest session error:', error);
            res.status(500).json({ error: error.message });
        }
    },
};

module.exports = AuthController; // <-- PASTIKAN INI ADA!