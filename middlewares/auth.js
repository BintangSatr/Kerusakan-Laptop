// middlewares/auth.js
const { verifyToken } = require('../config/jwt');

const authMiddleware = async (req, res, next) => {
    try {
        // 1. Ambil token dari header Authorization
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'Token tidak ditemukan!' });
        }

        // 2. Format header harus "Bearer TOKEN"
        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Format token salah! Gunakan: Bearer <token>' });
        }

        // 3. Verifikasi token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ error: 'Token tidak valid atau kadaluarsa!' });
        }

        // 4. Simpan data user ke request
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan autentikasi' });
    }
};

module.exports = authMiddleware;