const supabase = require('../config/supabaseClient');

const NotificationModel = {
    // Ambil semua broadcast
    findAll: async (page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data, total: count };
    },

    // Kirim broadcast
    create: async (title, message, target = 'all', adminId = null) => {
        const { data, error } = await supabase
            .from('notifications')
            .insert([{
                title,
                message,
                target,
                created_by: adminId
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = NotificationModel;