const supabase = require('../config/supabaseClient');

const SymptomModel = {
    findAll: async (filters = {}) => {
        let query = supabase.from('symptoms').select('*');
        if (filters.group) query = query.eq('symptom_group', filters.group);
        if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
        const { data, error } = await query.order('name');
        if (error) throw error;
        return data;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('symptoms')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },
    // Admin: Dapatkan semua gejala dengan pagination dan filter
    findAllAdmin: async (page = 1, limit = 10, group = '') => {
        let query = supabase.from('symptoms').select('*', { count: 'exact' });
        if (group) query = query.eq('symptom_group', group);
        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('code');
        if (error) throw error;
        return { data, total: count };
    },

    // Admin: Hapus gejala (soft delete)
    deleteAdmin: async (id) => {
        const { error } = await supabase
            .from('symptoms')
            .update({ is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('symptoms')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        return data;
    },
};

module.exports = SymptomModel;