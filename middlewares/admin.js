// middlewares/admin.js
const adminMiddleware = (req, res, next) => {
    // Cek apakah user sudah login (req.user harus ada dari authMiddleware)
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized: Silakan login terlebih dahulu!' });
    }

    // Cek apakah role user adalah 'admin'
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Akses ditolak! Hanya untuk admin.' });
    }

    // Jika lolos semua pengecekan, lanjutkan ke endpoint
    next();
};

module.exports = adminMiddleware;