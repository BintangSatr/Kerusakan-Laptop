// models/logModel.js
const supabase = require('../config/supabaseClient');

const LogModel = {
    findAll: async (page = 1, limit = 10, action = '', userId = '') => {
        // 🔥 PERBAIKAN: Gunakan select biasa tanpa `users!inner`, lalu join manual
        let query = supabase
            .from('system_logs')
            .select(`
                *,
                users (
                    id,
                    username,
                    email
                )
            `, { count: 'exact' });

        if (action) query = query.eq('action', action);
        if (userId) query = query.eq('user_id', parseInt(userId));

        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, total: count };
    },

    create: async (userId, action, details = null, ip = null, userAgent = null) => {
        const { data, error } = await supabase
            .from('system_logs')
            .insert([{
                user_id: userId,
                action,
                details,
                ip_address: ip,
                user_agent: userAgent
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = LogModel;