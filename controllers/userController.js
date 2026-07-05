// controllers/userController.js
const UserService = require('../services/userService');

const UserController = {
    // ============================================
    // 1. GET PROFILE
    // ============================================
    getProfile: async (req, res) => {
        try {
            const user = await UserService.getProfile(req.user.id);
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 2. UPDATE PROFILE
    // ============================================
    updateProfile: async (req, res) => {
        try {
            const { full_name, phone, profile_picture } = req.body;
            const user = await UserService.updateProfile(req.user.id, { full_name, phone, profile_picture });
            res.json({ message: 'Profil berhasil diupdate!', data: user });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 3. CHANGE PASSWORD
    // ============================================
    changePassword: async (req, res) => {
        try {
            const { old_password, new_password } = req.body;
            if (!old_password || !new_password) {
                return res.status(400).json({ error: 'Password lama dan baru wajib diisi!' });
            }
            const result = await UserService.changePassword(req.user.id, old_password, new_password);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 4. GET HISTORY
    // ============================================
    getHistory: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const history = await UserService.getHistory(req.user.id, page, limit);
            res.json(history);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 5. GET FAVORITES
    // ============================================
    getFavorites: async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const favorites = await UserService.getFavorites(req.user.id, page, limit);
            res.json(favorites);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 6. ADD FAVORITE
    // ============================================
    addFavorite: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const result = await UserService.toggleFavorite(consultationId, req.user.id);
            res.json({ message: 'Berhasil ditambahkan ke favorit!', data: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 7. REMOVE FAVORITE
    // ============================================
    removeFavorite: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const result = await UserService.removeFavorite(consultationId, req.user.id);
            res.json({ message: 'Berhasil dihapus dari favorit!', data: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 8. GET SETTINGS
    // ============================================
    getSettings: async (req, res) => {
        try {
            const settings = await UserService.getSettings(req.user.id);
            res.json(settings);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================
    // 9. UPDATE SETTINGS
    // ============================================
    updateSettings: async (req, res) => {
        try {
            const settings = await UserService.updateSettings(req.user.id, req.body);
            res.json({ message: 'Pengaturan berhasil diupdate!', data: settings });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 10. TAMBAH CATATAN DIAGNOSIS
    // ============================================
    addNote: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const { notes } = req.body;

            if (!notes) {
                return res.status(400).json({ error: 'Catatan wajib diisi!' });
            }

            const result = await UserService.addNote(consultationId, req.user.id, notes);
            res.json({ 
                message: 'Catatan berhasil ditambahkan!', 
                data: result 
            });
        } catch (error) {
            console.error('Add note error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 11. HAPUS RIWAYAT DIAGNOSIS
    // ============================================
    deleteHistory: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const result = await UserService.deleteHistory(consultationId, req.user.id);
            res.json({ 
                message: 'Riwayat diagnosis berhasil dihapus!', 
                data: result 
            });
        } catch (error) {
            console.error('Delete history error:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================
    // 12. HAPUS AKUN (PERMANEN)
    // ============================================
    deleteAccount: async (req, res) => {
         console.log('🟡 deleteAccount controller - req.user:', req.user);
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password wajib diisi untuk konfirmasi!' });
            }

            const result = await UserService.deleteAccount(req.user.id, password);
            res.json(result);
        } catch (error) {
            console.error('Delete account error:', error);
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = UserController;