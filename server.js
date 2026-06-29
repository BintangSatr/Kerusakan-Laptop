// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware Global ---
app.use(cors());
app.use(express.json());

// ============================================================
// 1. IMPORT ROUTES (HANYA 1 KALI!)
// ============================================================
const authRoutes = require('./routes/authRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes'); // <-- TAMBAHKAN DI SINI
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
console.log('🔍 userRoutes type:', typeof userRoutes);
console.log('🔍 userRoutes value:', userRoutes);

// ============================================================
// 2. DAFTARKAN ROUTES (HANYA 1 KALI!)
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/diagnosis', diagnosisRoutes); // <-- TAMBAHKAN DI SINI
app.use('/api/admin', adminRoutes);

// ============================================================
// 3. ROUTE ROOT (Sambutan)
// ============================================================
app.get('/', (req, res) => {
    res.json({
        message: '🚀 Sistem Pakar Kerusakan Laptop API Siap Digunakan!',
        version: '1.0.0',
        endpoints: {
            auth: {
                register: 'POST /api/auth/register',
                login: 'POST /api/auth/login',
                profile: 'GET /api/auth/me'
            },
            diagnosis: {
                symptoms: 'GET /api/diagnosis/symptoms',
                damages: 'GET /api/diagnosis/damages',
                start: 'POST /api/diagnosis/start',
                process: 'POST /api/diagnosis/process',
                result: 'GET /api/diagnosis/:id/result'
            }
        }
    });
});

// ============================================================
// 4. PENANGANAN ROUTE TIDAK DITEMUKAN (404)
// ============================================================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan!' });
});

// ============================================================
// 5. ERROR HANDLER GLOBAL (500)
// ============================================================
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan internal server!' });
});

// ============================================================
// 6. JALANKAN SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    console.log(`📊 Terhubung ke Supabase!`);
    console.log(`🔐 Auth endpoint tersedia di /api/auth`);
    console.log(`🩺 Diagnosis endpoint tersedia di /api/diagnosis`);
});