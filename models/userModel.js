// models/userModel.js
const supabase = require('../config/supabaseClient');
const bcrypt = require('bcryptjs');

const UserModel = {
    // ============================================
    // 1. CARI USER BERDASARKAN EMAIL ATAU USERNAME
    // ============================================
    findByEmailOrUsername: async (identifier) => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .or(`email.eq.${identifier},username.eq.${identifier}`)
            .maybeSingle();

        if (error) throw error;
        return data; // Bisa null jika tidak ditemukan
    },

    // ============================================
    // 2. CARI USER BERDASARKAN ID
    // ============================================
    findById: async (id) => {
        const { data, error } = await supabase
            .from('users')
            .select('id, username, email, full_name, role, is_active, created_at, password_hash')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // ============================================
    // 3. BUAT USER BARU (REGISTRASI)
    // ============================================
    create: async (userData) => {
        const { username, email, password, full_name } = userData;

        // Hash password sebelum disimpan
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const { data, error } = await supabase
            .from('users')
            .insert([{
                username,
                email,
                password_hash: hashedPassword,
                full_name,
                role: 'user',
                is_active: true
            }])
            .select('id, username, email, full_name, role')
            .single();

        if (error) throw error;
        return data;
    },

    // ============================================
    // 4. VERIFIKASI PASSWORD (UNTUK LOGIN)
    // ============================================
    verifyPassword: async (plainPassword, hashedPassword) => {
        return await bcrypt.compare(plainPassword, hashedPassword);
    },

    // Update profil user
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', id)
            .select('id, username, email, full_name, role, phone, profile_picture, is_active')
            .single();

        if (error) throw error;
        return data;
    },

    // Update password
    updatePassword: async (id, newPassword) => {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', id);

        if (error) throw error;
        return true;
    },

    // Admin: Dapatkan semua user dengan pagination dan filter
    findAllAdmin: async (page = 1, limit = 10, search = '', role = '') => {
        let query = supabase.from('users').select('*', { count: 'exact' });
        if (search) {
            query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,full_name.ilike.%${search}%`);
        }
        if (role) query = query.eq('role', role);
        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data, total: count };
    },

    // Admin: Reset password
    resetPassword: async (id, newPassword) => {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        const { error } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Admin: Toggle aktif/nonaktif user
    toggleActive: async (id, isActive) => {
        const { data, error } = await supabase
            .from('users')
            .update({ is_active: isActive })
            .eq('id', id)
            .select('id, username, email, full_name, role, is_active')
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = UserModel; // <-- PASTIKAN INI ADA!