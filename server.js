// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Register Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/admin', adminRoutes);

// Root Route
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Sistem Pakar Kerusakan Laptop API Siap Digunakan!',
        version: '1.0.0'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan!' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal server!' });
});

// server.js (tambahkan di bawah semua route, sebelum app.listen)

// === DEBUG: Cetak semua route yang terdaftar ===
console.log('🔍 DAFTAR ROUTE YANG TERDAFTAR:');
const listRoutes = (stack) => {
    stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
            console.log(`  ${methods} /api/auth${layer.route.path}`);
        }
    });
};

// Cari router auth di app._router.stack
const authLayer = app._router.stack.find(layer => layer.handle.name === 'router' && layer.regexp.test('/api/auth'));
if (authLayer) {
    listRoutes(authLayer.handle.stack);
} else {
    console.log('❌ Route /api/auth tidak ditemukan!');
}
// ============================================

// Jalankan Server
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📊 Terhubung ke Supabase!`);
});" " 
