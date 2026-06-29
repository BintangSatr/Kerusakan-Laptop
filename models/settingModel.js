// models/settingModel.js
const supabase = require('../config/supabaseClient');

const SettingModel = {
    // Ambil setting user berdasarkan ID
    findByUserId: async (userId) => {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    // Buat setting default untuk user baru
    create: async (userId) => {
        const defaultSettings = {
            user_id: userId,
            language: 'id',
            music: true,
            effects: true,
            voice_mode: false,
            animations: true,
            sensitive_filter: false
        };

        const { data, error } = await supabase
            .from('user_settings')
            .insert([defaultSettings])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update setting
    update: async (userId, updates) => {
        const { data, error } = await supabase
            .from('user_settings')
            .update(updates)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = SettingModel;