// models/consultationModel.js
const supabase = require('../config/supabaseClient');

const ConsultationModel = {
    create: async (data) => {
        const { data: result, error } = await supabase
            .from('consultations')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    findById: async (id) => {
        const { data, error } = await supabase
            .from('consultations')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error) throw error;
        return data;
    },

    findByUser: async (userId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        const { data, error } = await supabase
            .from('consultations')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data;
    },

    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('consultations')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ===== METHOD BARU UNTUK INTERACTIVE Q&A =====
    updateAnsweredSymptoms: async (id, answeredSymptoms, answeredCount) => {
        const { data, error } = await supabase
            .from('consultations')
            .update({ 
                answered_symptoms: answeredSymptoms,
                answered_count: answeredCount
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    completeConsultation: async (id, results, completedAt = new Date()) => {
        const { data, error } = await supabase
            .from('consultations')
            .update({
                status: 'completed',
                results: results,
                completed_at: completedAt
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // ===== FAVORITE METHODS (UNTUK NANTI) =====
    toggleFavorite: async (consultationId, userId) => {
        const { data, error } = await supabase
            .from('consultations')
            .update({ is_favorite: true })
            .eq('id', consultationId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    removeFavorite: async (consultationId, userId) => {
        const { data, error } = await supabase
            .from('consultations')
            .update({ is_favorite: false })
            .eq('id', consultationId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    getFavorites: async (userId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        const { data, error } = await supabase
            .from('consultations')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .eq('is_favorite', true)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);
        if (error) throw error;
        return data;
    },

    addNote: async (consultationId, userId, notes) => {
        const { data, error } = await supabase
            .from('consultations')
            .update({ notes })
            .eq('id', consultationId)
            .eq('user_id', userId)
            .select()
            .single();
        if (error) throw error;
        return data;
    }
};

module.exports = ConsultationModel;