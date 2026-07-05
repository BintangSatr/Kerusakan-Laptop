// middlewares/optionalAuth.js
const { verifyToken } = require('../config/jwt');

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            if (token) {
                const decoded = verifyToken(token);
                if (decoded) {
                    req.user = decoded;
                }
            }
        }
        next(); // Tetap lanjutkan meskipun tidak ada token
    } catch (error) {
        next(); // Tetap lanjutkan jika error
    }
};

module.exports = optionalAuth;