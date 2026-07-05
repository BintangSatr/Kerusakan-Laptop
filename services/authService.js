// services/authService.js
const UserModel = require('../models/userModel');
const { generateToken, generateRefreshToken } = require('../config/jwt');
const supabase = require('../config/supabaseClient');

const AuthService = {
    // ============================================
    // REGISTER
    // ============================================
    register: async (userData) => {
        const { username, email, password, full_name } = userData;
        const existingUser = await UserModel.findByEmailOrUsername(email);
        if (existingUser) throw new Error('Email atau username sudah terdaftar!');
        
        const newUser = await UserModel.create({ username, email, password, full_name });
        const token = generateToken({ id: newUser.id, email: newUser.email, role: newUser.role });
        return { user: newUser, token };
    },

    // ============================================
    // LOGIN
    // ============================================
    login: async (identifier, password) => {
        const user = await UserModel.findByEmailOrUsername(identifier);
        if (!user) throw new Error('Email/Username atau password salah!');
        if (!user.is_active) throw new Error('Akun Anda telah dinonaktifkan!');
        
        const isValid = await UserModel.verifyPassword(password, user.password_hash);
        if (!isValid) throw new Error('Email/Username atau password salah!');
        
        const token = generateToken({ id: user.id, email: user.email, role: user.role });
        
        // Generate & save refresh token
        const refreshToken = generateRefreshToken();
        await AuthService.saveRefreshToken(user.id, refreshToken);
        
        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            },
            token: token,
            refresh_token: refreshToken
        };
    },

    // ============================================
    // GET PROFILE
    // ============================================
    getProfile: async (userId) => {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User tidak ditemukan!');
        return user;
    },

    // ============================================
    // GUEST SESSION
    // ============================================
    createGuestSession: async () => {
        const guestSessionId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
        return {
            guest_session_id: guestSessionId,
            message: 'Sesi tamu berhasil dibuat. Gunakan guest_session_id untuk memulai konsultasi.',
            expires_in: '7 days'
        };
    },

    // ============================================
    // REFRESH TOKEN
    // ============================================
    saveRefreshToken: async (userId, refreshToken) => {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { data, error } = await supabase
            .from('refresh_tokens')
            .insert([{
                user_id: userId,
                token: refreshToken,
                expires_at: expiresAt.toISOString(),
                revoked: false
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    verifyRefreshToken: async (refreshToken) => {
    const { data, error } = await supabase
        .from('refresh_tokens')
        .select('*, users!inner(id, email, role)')
        .eq('token', refreshToken)
        .eq('revoked', false)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Cek kedaluwarsa di JavaScript (AMAN, TANPA TIMEZONE ISSUE!)
    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (expiresAt < now) {
        await supabase
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('id', data.id);
        return null;
    }

    return {
            user: {
                id: data.users.id,
                email: data.users.email,
                role: data.users.role
            },
        refreshToken: data
        };
    },

    revokeRefreshToken: async (refreshToken) => {
        const { error } = await supabase
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('token', refreshToken);

        if (error) throw error;
        return true;
    },

    revokeAllRefreshTokens: async (userId) => {
        const { error } = await supabase
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Revoke all refresh tokens error:', error);
            throw error;
        }
        return true;
    },

    // ============================================
    // 1. LOGOUT (Simple)
    // ============================================
    logout: async (userId) => {
        // Untuk logout sederhana, client hapus token.
        // Tapi kita tetap berikan response.
        return { message: 'Logout berhasil!' };
    },

    // ============================================
    // 2. LOGOUT ALL (Revoke all refresh tokens)
    // ============================================
    logoutAll: async (userId) => {
        const { error } = await supabase
            .from('refresh_tokens')
            .update({ revoked: true })
            .eq('user_id', userId);

        if (error) throw error;
        return { message: 'Logout dari semua perangkat berhasil!' };
    },

    // ============================================
    // 3. VERIFY EMAIL
    // ============================================
    verifyEmail: async (token) => {
        // 1. Cari token
        const { data, error } = await supabase
            .from('email_verifications')
            .select('*, users!inner(id, email)')
            .eq('token', token)
            .eq('verified', false)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            throw new Error('Token verifikasi tidak valid atau sudah kadaluarsa!');
        }

        // 2. Update user: email_verified = true
        const { error: updateError } = await supabase
            .from('users')
            .update({ email_verified: true })
            .eq('id', data.user_id);

        if (updateError) throw updateError;

        // 3. Tandai token sudah digunakan
        await supabase
            .from('email_verifications')
            .update({ verified: true })
            .eq('id', data.id);

        return { message: 'Email berhasil diverifikasi!' };
    },

    // ============================================
    // 4. RESEND VERIFICATION EMAIL
    // ============================================
    resendVerification: async (email) => {
        // 1. Cari user
        const user = await UserModel.findByEmailOrUsername(email);
        if (!user) {
            return { message: 'Jika email terdaftar, link verifikasi akan dikirim.' };
        }

        if (user.email_verified) {
            return { message: 'Email sudah terverifikasi.' };
        }

        // 2. Generate token baru
        const crypto = require('crypto');
        const verifyToken = crypto.randomBytes(32).toString('hex');

        // 3. Simpan ke database (expired 24 jam)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        // Hapus token lama
        await supabase
            .from('email_verifications')
            .update({ verified: true })
            .eq('user_id', user.id);

        // Insert token baru
        const { error } = await supabase
            .from('email_verifications')
            .insert([{
                user_id: user.id,
                token: verifyToken,
                expires_at: expiresAt.toISOString(),
                verified: false
            }]);

        if (error) throw error;

        return {
            message: 'Link verifikasi baru telah dikirim ke email Anda.',
            verification_token: verifyToken // <-- Untuk testing
        };
    },

    // ============================================
    // 5. CONVERT GUEST TO USER
    // ============================================
    convertGuest: async (guestSessionId, userData) => {
        const { username, email, password, full_name } = userData;

        // 1. Cek apakah email sudah terdaftar
        const existingUser = await UserModel.findByEmailOrUsername(email);
        if (existingUser) {
            throw new Error('Email sudah terdaftar! Silakan login.');
        }

        // 2. Ambil semua konsultasi guest
        const { data: guestConsultations, error: consultError } = await supabase
            .from('consultations')
            .select('*')
            .eq('guest_session_id', guestSessionId)
            .eq('is_guest', true);

        if (consultError) throw consultError;

        // 3. Buat user baru
        const newUser = await UserModel.create({ username, email, password, full_name });

        // 4. Update konsultasi guest -> pindahkan ke user baru
        if (guestConsultations && guestConsultations.length > 0) {
            const consultationIds = guestConsultations.map(c => c.id);
            const { error: updateError } = await supabase
                .from('consultations')
                .update({
                    user_id: newUser.id,
                    is_guest: false,
                    guest_session_id: null
                })
                .in('id', consultationIds);

            if (updateError) throw updateError;
        }

        // 5. Generate token untuk user baru
        const token = generateToken({
            id: newUser.id,
            email: newUser.email,
            role: newUser.role
        });

        // 6. Generate refresh token
        const refreshToken = generateRefreshToken();
        await AuthService.saveRefreshToken(newUser.id, refreshToken);

        return {
            message: 'Akun berhasil dibuat! Riwayat konsultasi tamu telah dipindahkan.',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                full_name: newUser.full_name,
                role: newUser.role
            },
            token: token,
            refresh_token: refreshToken,
            consultations_transferred: guestConsultations ? guestConsultations.length : 0
        };
    },

    // ============================================
    // FORGOT PASSWORD
    // ============================================
    forgotPassword: async (email) => {
        // 1. Cari user berdasarkan email
        const user = await UserModel.findByEmailOrUsername(email);
        if (!user) {
            // Jangan kasih tahu email tidak terdaftar (security)
            return { 
                message: 'Jika email terdaftar, link reset password akan dikirim.' 
            };
        }

        // 2. Generate reset token (random string)
        const crypto = require('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');

        // 3. Simpan ke database (expired 1 jam)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        const { error } = await supabase
            .from('password_resets')
            .insert([{
                user_id: user.id,
                token: resetToken,
                expires_at: expiresAt.toISOString(),
                used: false
            }]);

        if (error) throw error;

        // 4. Kembalikan token (untuk testing)
        //    Nanti diganti dengan kirim email
        return {
            message: 'Link reset password telah dikirim ke email Anda.',
            reset_token: resetToken, // <-- Untuk testing, hapus nanti
            email: user.email
        };
    },

    // ============================================
    // RESET PASSWORD
    // ============================================
    resetPassword: async (token, newPassword) => {
        // 1. Cari token di database
        const { data, error } = await supabase
            .from('password_resets')
            .select('*, users!inner(id, email)')
            .eq('token', token)
            .eq('used', false)
            .gte('expires_at', new Date().toISOString())
            .maybeSingle();

        if (error) throw error;
        if (!data) {
            throw new Error('Token reset tidak valid atau sudah kadaluarsa!');
        }

        // 2. Update password user
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', data.user_id);

        if (updateError) throw updateError;

        // 3. Tandai token sudah digunakan
        await supabase
            .from('password_resets')
            .update({ used: true })
            .eq('id', data.id);

        // 4. Revoke semua refresh token user (force logout from all devices)
        await AuthService.revokeAllRefreshTokens(data.user_id);

        return {
            message: 'Password berhasil direset! Silakan login dengan password baru.'
        };
    },
};

module.exports = AuthService;