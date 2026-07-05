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
            const guestSession = await AuthService.createGuestSession();
            res.status(201).json(guestSession);
        } catch (error) {
            console.error('Guest session error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // REFRESH TOKEN
    // ============================================
    refresh: async (req, res) => {
        try {
            const { refresh_token } = req.body;
            if (!refresh_token) {
                return res.status(400).json({ error: 'Refresh token wajib diisi!' });
            }

            // Verifikasi refresh token
            const result = await AuthService.verifyRefreshToken(refresh_token);
            if (!result) {
                return res.status(401).json({ error: 'Refresh token tidak valid atau kadaluarsa!' });
            }

            // Generate access token baru
            const newToken = require('../config/jwt').generateToken({
                id: result.user.id,
                email: result.user.email,
                role: result.user.role
            });

            // Revoke refresh token lama (one-time use)
            await AuthService.revokeRefreshToken(refresh_token);

            // Generate refresh token baru
            const newRefreshToken = require('../config/jwt').generateRefreshToken();
            await AuthService.saveRefreshToken(result.user.id, newRefreshToken);

            res.json({
                token: newToken,
                refresh_token: newRefreshToken
            });
        } catch (error) {
            console.error('Refresh error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // FORGOT PASSWORD
    // ============================================
    forgotPassword: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email wajib diisi!' });
            }

            const result = await AuthService.forgotPassword(email);
            res.json(result);
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // RESET PASSWORD
    // ============================================
    resetPassword: async (req, res) => {
        try {
            const { token, new_password } = req.body;
            if (!token || !new_password) {
                return res.status(400).json({ 
                    error: 'Token dan password baru wajib diisi!' 
                });
            }

            if (new_password.length < 6) {
                return res.status(400).json({ 
                    error: 'Password minimal 6 karakter!' 
                });
            }

            const result = await AuthService.resetPassword(token, new_password);
            res.json(result);
        } catch (error) {
            console.error('Reset password error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 1. LOGOUT
    // ============================================
    logout: async (req, res) => {
        try {
            const result = await AuthService.logout(req.user.id);
            res.json(result);
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 2. LOGOUT ALL
    // ============================================
    logoutAll: async (req, res) => {
        try {
            const result = await AuthService.logoutAll(req.user.id);
            res.json(result);
        } catch (error) {
            console.error('Logout all error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 3. VERIFY EMAIL
    // ============================================
    verifyEmail: async (req, res) => {
        try {
            const { token } = req.body;
            if (!token) {
                return res.status(400).json({ error: 'Token wajib diisi!' });
            }

            const result = await AuthService.verifyEmail(token);
            res.json(result);
        } catch (error) {
            console.error('Verify email error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 4. RESEND VERIFICATION
    // ============================================
    resendVerification: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ error: 'Email wajib diisi!' });
            }

            const result = await AuthService.resendVerification(email);
            res.json(result);
        } catch (error) {
            console.error('Resend verification error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 5. CONVERT GUEST
    // ============================================
    convertGuest: async (req, res) => {
        try {
            const { guest_session_id, username, email, password, full_name } = req.body;

            if (!guest_session_id || !username || !email || !password || !full_name) {
                return res.status(400).json({
                    error: 'guest_session_id, username, email, password, full_name wajib diisi!'
                });
            }

            const result = await AuthService.convertGuest(guest_session_id, {
                username,
                email,
                password,
                full_name
            });

            res.status(201).json(result);
        } catch (error) {
            console.error('Convert guest error:', error);
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = AuthController;