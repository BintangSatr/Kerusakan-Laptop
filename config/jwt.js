// config/jwt.js
const jwt = require('jsonwebtoken');

// Ambil kunci rahasia dari file .env
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d'; // Token berlaku 7 hari

// Fungsi 1: MEMBUAT TOKEN (Stempel)
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Fungsi 2: MEMERIKSA TOKEN
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

// ============================================
// EKSPOR KEDUA FUNGSI (INI YANG SERING TERLUPA!)
// ============================================
module.exports = { generateToken, verifyToken };