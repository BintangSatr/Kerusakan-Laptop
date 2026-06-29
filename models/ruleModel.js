// models/ruleModel.js
const supabase = require('../config/supabaseClient');

const RuleModel = {
    findAll: async (filters = {}) => {
        let query = supabase.from('knowledge_base').select('*'); // <-- GANTI KE knowledge_base
        if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
        const { data, error } = await query.order('priority', { ascending: false });
        if (error) throw error;
        return data;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('knowledge_base') // <-- GANTI KE knowledge_base
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    create: async (data) => {
        const { data: result, error } = await supabase
            .from('knowledge_base') // <-- GANTI KE knowledge_base
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('knowledge_base') // <-- GANTI KE knowledge_base
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    delete: async (id) => {
        const { error } = await supabase
            .from('knowledge_base') // <-- GANTI KE knowledge_base
            .update({ is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    },

    // Admin: Dapatkan semua aturan dengan pagination
    findAllAdmin: async (page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        const { data, error, count } = await supabase
            .from('knowledge_base')
            .select('*', { count: 'exact' })
            .range(offset, offset + limit - 1)
            .order('priority', { ascending: false });
        if (error) throw error;
        return { data, total: count };
    },

    // Admin: Hapus aturan (soft delete)
    deleteAdmin: async (id) => {
        const { error } = await supabase
            .from('knowledge_base')
            .update({ is_active: false })
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = RuleModel;