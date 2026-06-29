// services/authService.js
const UserModel = require('../models/userModel');
const { generateToken } = require('../config/jwt');

const AuthService = {
    // ============================================
    // 1. FUNGSI REGISTER
    // ============================================
    register: async (userData) => {
        const { username, email, password, full_name } = userData;

        // Cek apakah email/username sudah terdaftar
        const existingUser = await UserModel.findByEmailOrUsername(email);
        if (existingUser) {
            throw new Error('Email atau username sudah terdaftar!');
        }

        // Buat user baru
        const newUser = await UserModel.create({ username, email, password, full_name });

        // Buat token JWT
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role
        });

        return {
            user: newUser,
            token: token
        };
    },

    // ============================================
    // 2. FUNGSI LOGIN (INI YANG HILANG!)
    // ============================================
    login: async (identifier, password) => {
        // Cari user berdasarkan email atau username
        const user = await UserModel.findByEmailOrUsername(identifier);
        if (!user) {
            throw new Error('Email/Username atau password salah!');
        }

        // Cek apakah akun aktif
        if (!user.is_active) {
            throw new Error('Akun Anda telah dinonaktifkan!');
        }

        // Verifikasi password
        const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error('Email/Username atau password salah!');
        }

        // Buat token JWT
        const token = generateToken({
            id: user.id,
            email: user.email,
            role: user.role
        });

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token: token
        };
    },

    // ============================================
    // 3. FUNGSI GET PROFILE
    // ============================================

    getProfile: async (userId) => {
        const UserModel = require('../models/userModel');
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User tidak ditemukan!');
        }
        return user;
    },

    createGuestSession: async () => {
        // Generate guest session ID unik
        const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        return {
            guest_session_id: guestSessionId,
            message: 'Sesi tamu berhasil dibuat. Gunakan guest_session_id untuk memulai konsultasi.',
            expires_in: '7 days' // Bisa diatur sesuai kebutuhan
        };
    },
};

module.exports = AuthService; // <-- PASTIKAN INI ADA!