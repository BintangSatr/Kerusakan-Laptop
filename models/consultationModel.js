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

    // models/consultationModel.js (di findByUser, tambahkan filter)
    findByUser: async (userId, page = 1, limit = 10) => {
        const offset = (page - 1) * limit;
        const { data, error } = await supabase
            .from('consultations')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .is('deleted_at', null) // <-- TAMBAHKAN BARIS INI
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

    // ===== FAVORITE METHODS =====
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
            .update({ notes: notes })
            .eq('id', consultationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Admin methods
    findAllAdmin: async (page = 1, limit = 10, status = '', dateFrom = '', dateTo = '') => {
        let query = supabase.from('consultations').select('*', { count: 'exact' });
        if (status) query = query.eq('status', status);
        if (dateFrom) query = query.gte('created_at', dateFrom);
        if (dateTo) query = query.lte('created_at', dateTo);
        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { data, total: count };
    },

    getResults: async (consultationId) => {
        const { data, error } = await supabase
            .from('consultations')
            .select('results')
            .eq('id', consultationId)
            .single();
        if (error) throw error;
        return data ? data.results : null;
    },

    delete: async (consultationId, userId) => {
        // Soft delete: set deleted_at
        const { data, error } = await supabase
            .from('consultations')
            .update({ 
                deleted_at: new Date().toISOString(),
                status: 'completed' // Tetap completed agar tidak melanggar constraint
            })
            .eq('id', consultationId)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

        cancel: async (consultationId, userId = null, guestSessionId = null) => {
        let query = supabase
            .from('consultations')
            .update({ 
                deleted_at: new Date().toISOString()
                // JANGAN ubah status! Biarkan tetap 'in_progress' atau 'completed'
            })
            .eq('id', consultationId)
            .eq('status', 'in_progress'); // Hanya yang belum selesai

        if (userId) {
            query = query.eq('user_id', userId);
        } else if (guestSessionId) {
            query = query.eq('guest_session_id', guestSessionId);
        } else {
            throw new Error('User ID atau Guest Session ID diperlukan!');
        }

        const { data, error } = await query.select().maybeSingle();

        if (error) throw error;
        if (!data) {
            throw new Error('Konsultasi tidak ditemukan, sudah selesai, atau Anda tidak memiliki akses!');
        }
        return data;
    },
};

module.exports = ConsultationModel;