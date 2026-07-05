// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(cors());
app.use(express.json());

// ============================================================
// IMPORT ROUTES
// ============================================================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const adminRoutes = require('./routes/adminRoutes');

// ============================================================
// REGISTER ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/admin', adminRoutes);

// ============================================================
// ROOT ROUTE (Health Check)
// ============================================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Sistem Pakar Diagnosis Kerusakan Laptop API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            auth: '/api/auth',
            user: '/api/user',
            diagnosis: '/api/diagnosis',
            admin: '/api/admin'
        }
    });
});

// ============================================================
// 404 NOT FOUND HANDLER
// ============================================================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan!' });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Global error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal server!' });
});

// ============================================================
// START SERVER (Lokal) / EXPORT (Vercel)
// ============================================================
const startServer = () => {
    app.listen(PORT, () => {
        console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
        console.log(`📊 Terhubung ke Supabase!`);
        console.log(`🔐 Auth endpoint: /api/auth`);
        console.log(`👤 User endpoint: /api/user`);
        console.log(`🩺 Diagnosis endpoint: /api/diagnosis`);
        console.log(`🛠️ Admin endpoint: /api/admin`);
    });
};

// Jika di Vercel, ekspor app (tanpa listen)
if (process.env.VERCEL) {
    module.exports = app;
} else {
    // Jika di lokal, jalankan server
    startServer();
}