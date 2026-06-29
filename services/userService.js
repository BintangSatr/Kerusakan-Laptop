// services/userService.js
const UserModel = require('../models/userModel');
const SettingModel = require('../models/settingModel');
const ConsultationModel = require('../models/consultationModel');

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
    }
};

module.exports = UserService;