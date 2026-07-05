const supabase = require('../config/supabaseClient');

const DamageModel = {
    findAll: async (filters = {}) => {
        let query = supabase.from('damages').select('*');
        if (filters.severity) query = query.eq('severity_level', filters.severity);
        if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
        const { data, error } = await query.order('name');
        if (error) throw error;
        return data;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('damages')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    getSolutions: async (damageId) => {
        const { data, error } = await supabase
            .from('damage_solutions')  // <-- Nama tabel sudah di-rename
            .select('*')
            .eq('damage_id', damageId)
            .order('step_order');
        if (error) throw error;
        return data;
    },

    getDamageSymptoms: async (damageId) => {
        const { data, error } = await supabase
            .from('damage_symptoms')
            .select('symptom_id, cf_value, is_mandatory')
            .eq('damage_id', damageId);
        if (error) throw error;
        return data;
    },

    // Admin: Dapatkan semua kerusakan dengan pagination dan filter
    findAllAdmin: async (page = 1, limit = 10, severity = '') => {
        let query = supabase.from('damages').select('*', { count: 'exact' });
        if (severity) query = query.eq('severity_level', severity);
        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('code');
        if (error) throw error;
        return { data, total: count };
    },

    // Admin: Hapus kerusakan (soft delete)
    deleteAdmin: async (id) => {
        const { error } = await supabase
            .from('damages')
            .update({ is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('damages')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },
};

module.exports = DamageModel;