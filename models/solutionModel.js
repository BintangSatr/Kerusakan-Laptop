// models/solutionModel.js
const supabase = require('../config/supabaseClient');

const SolutionModel = {
    /**
     * Mendapatkan semua solusi untuk suatu kerusakan berdasarkan damage_id
     * @param {number} damageId - ID kerusakan
     * @returns {Promise<Array>} - Daftar solusi
     */
    findByDamageId: async (damageId) => {
        const { data, error } = await supabase
            .from('damage_solutions') // Nama tabel di database Anda
            .select('*')
            .eq('damage_id', damageId)
            .order('step_order', { ascending: true });
        
        if (error) throw error;
        return data;
    },

    /**
     * Membuat solusi baru
     * @param {Object} solutionData - Data solusi (damage_id, step_order, description, is_preventive, requires_tools)
     * @returns {Promise<Object>} - Solusi yang baru dibuat
     */
    create: async (solutionData) => {
        const { data, error } = await supabase
            .from('damage_solutions')
            .insert([solutionData])
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Mengupdate solusi berdasarkan ID
     * @param {number} id - ID solusi
     * @param {Object} updates - Data yang akan diupdate
     * @returns {Promise<Object>} - Solusi yang sudah diupdate
     */
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('damage_solutions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    },

    /**
     * Menghapus solusi berdasarkan ID
     * @param {number} id - ID solusi
     * @returns {Promise<boolean>} - true jika berhasil
     */
    delete: async (id) => {
        const { error } = await supabase
            .from('damage_solutions')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        return true;
    }
};

module.exports = SolutionModel;