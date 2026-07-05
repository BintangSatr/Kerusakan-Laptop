// services/userService.js
const UserModel = require('../models/userModel');
const SettingModel = require('../models/settingModel');
const ConsultationModel = require('../models/consultationModel');
const AuthService = require('./authService'); // <-- TAMBAHKAN
const supabase = require('../config/supabaseClient'); // <-- TAMBAHKAN

const UserService = {
    // ============================================
    // 1. GET PROFILE
    // ============================================
    getProfile: async (userId) => {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User tidak ditemukan!');
        return user;
    },

    // ============================================
    // 2. UPDATE PROFILE
    // ============================================
    updateProfile: async (userId, updates) => {
        const allowedUpdates = ['full_name', 'phone', 'profile_picture'];
        const filteredUpdates = {};
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error('Tidak ada field yang diupdate!');
        }

        const user = await UserModel.update(userId, filteredUpdates);
        return user;
    },

    // ============================================
    // 3. CHANGE PASSWORD
    // ============================================
    changePassword: async (userId, oldPassword, newPassword) => {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User tidak ditemukan!');

        // Verifikasi password lama
        const isValid = await UserModel.verifyPassword(oldPassword, user.password_hash);
        if (!isValid) throw new Error('Password lama salah!');

        // Update password
        await UserModel.updatePassword(userId, newPassword);
        return { message: 'Password berhasil diubah!' };
    },

    // ============================================
    // 4. GET HISTORY
    // ============================================
    getHistory: async (userId, page = 1, limit = 10) => {
        const consultations = await ConsultationModel.findByUser(userId, page, limit);
        return consultations;
    },

    // ============================================
    // 5. GET FAVORITES
    // ============================================
    getFavorites: async (userId, page = 1, limit = 10) => {
        return await ConsultationModel.getFavorites(userId, page, limit);
    },

    // ============================================
    // 6. TOGGLE FAVORITE
    // ============================================
    toggleFavorite: async (consultationId, userId) => {
        return await ConsultationModel.toggleFavorite(consultationId, userId);
    },

    // ============================================
    // 7. REMOVE FAVORITE
    // ============================================
    removeFavorite: async (consultationId, userId) => {
        return await ConsultationModel.removeFavorite(consultationId, userId);
    },

    // ============================================
    // 8. GET SETTINGS
    // ============================================
    getSettings: async (userId) => {
        let settings = await SettingModel.findByUserId(userId);
        if (!settings) {
            // Jika belum ada, buat default
            settings = await SettingModel.create(userId);
        }
        return settings;
    },

    // ============================================
    // 9. UPDATE SETTINGS
    // ============================================
    updateSettings: async (userId, updates) => {
        const allowedUpdates = ['language', 'music', 'effects', 'voice_mode', 'animations', 'sensitive_filter'];
        const filteredUpdates = {};
        for (const key of allowedUpdates) {
            if (updates[key] !== undefined) {
                filteredUpdates[key] = updates[key];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            throw new Error('Tidak ada setting yang diupdate!');
        }

        const settings = await SettingModel.update(userId, filteredUpdates);
        return settings;
    },

    // ============================================
    // 10. TAMBAH CATATAN DIAGNOSIS
    // ============================================
    addNote: async (consultationId, userId, notes) => {
        if (!notes || notes.trim() === '') {
            throw new Error('Catatan tidak boleh kosong!');
        }
        return await ConsultationModel.addNote(consultationId, userId, notes);
    },

    // ============================================
    // 11. HAPUS RIWAYAT DIAGNOSIS
    // ============================================
    deleteHistory: async (consultationId, userId) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) {
            throw new Error('Riwayat diagnosis tidak ditemukan!');
        }
        if (consultation.user_id !== userId) {
            throw new Error('Anda tidak memiliki akses ke riwayat ini!');
        }
        // LANGSUNG HAPUS (TANPA CEK STATUS)
        return await ConsultationModel.delete(consultationId, userId);
    },

    // ============================================
    // 12. HAPUS AKUN (PERMANEN)
    // ============================================
    deleteAccount: async (userId, password) => {
        console.log('🟡 deleteAccount - userId:', userId, 'type:', typeof userId);
        // VALIDASI: userId harus ada dan berupa angka
        if (!userId || isNaN(userId)) {
            throw new Error('User ID tidak valid!');
        }

        // 1. Cek user
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User tidak ditemukan!');
        }

        // VALIDASI: Pastikan password_hash ada
        if (!user.password_hash) {
            throw new Error('Data user tidak lengkap! Silakan hubungi admin.');
        }

        // 2. Verifikasi password
        const isValid = await UserModel.verifyPassword(password, user.password_hash);
        if (!isValid) {
            throw new Error('Password salah!');
        }

        // 3. Soft delete: set deleted_at dan nonaktifkan
        const now = new Date().toISOString();
        
        const { error } = await supabase
            .from('users')
            .update({ 
                is_active: false,
                deleted_at: now
            })
            .eq('id', userId);

        if (error) {
            console.error('❌ Supabase update error:', error);
            throw new Error('Gagal menghapus akun: ' + error.message);
        }

        // 4. Revoke semua refresh token
        try {
            await AuthService.revokeAllRefreshTokens(userId);
        } catch (err) {
            console.error('❌ Revoke refresh token error:', err);
            // Tidak perlu throw, karena akun sudah dihapus
        }

        return { message: 'Akun berhasil dihapus. Data Anda telah dinonaktifkan.' };
    },
};

module.exports = UserService;