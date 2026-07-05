// models/feedbackModel.js
const supabase = require('../config/supabaseClient');

const FeedbackModel = {
    /**
     * ADMIN: Mendapatkan semua feedback dengan filter pagination
     * @param {number} page - Halaman (default 1)
     * @param {number} limit - Jumlah per halaman (default 10)
     * @param {string} isCorrect - Filter 'true' atau 'false' (kosongkan untuk semua)
     * @returns {Promise<{data: Array, total: number}>}
     */
    // models/feedbackModel.js
    findAllAdmin: async (page = 1, limit = 10, isCorrect = '') => {
        let query = supabase
            .from('feedback')
            .select(`
                *,
                consultations (
                    user_id
                ),
                damages (
                    id,
                    name,
                    code
                )
            `, { count: 'exact' });

        if (isCorrect !== '') {
            query = query.eq('is_correct', isCorrect === 'true');
        }

        const offset = (page - 1) * limit;
        const { data, error, count } = await query
            .range(offset, offset + limit - 1)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, total: count };
    },

    /**
     * ADMIN: Mendapatkan statistik akurasi berdasarkan filter tanggal
     * @param {string} dateFrom - Tanggal awal (ISO)
     * @param {string} dateTo - Tanggal akhir (ISO)
     * @param {number} damageId - Filter spesifik damage (opsional)
     * @returns {Promise<Array>}
     */
    getAnalytics: async (dateFrom, dateTo, damageId = null) => {
        let query = supabase
            .from('feedback')
            .select(`
                *,
                consultations!inner(created_at),
                damages!inner(name)
            `)
            .not('consultations', 'is', null); // Pastikan consultation ada

        if (dateFrom) query = query.gte('consultations.created_at', dateFrom);
        if (dateTo) query = query.lte('consultations.created_at', dateTo);
        if (damageId) query = query.eq('actual_damage_id', parseInt(damageId));

        const { data, error } = await query;
        if (error) throw error;
        return data;
    }
};

module.exports = FeedbackModel;