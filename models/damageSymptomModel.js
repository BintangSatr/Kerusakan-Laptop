// models/damageSymptomModel.js
const supabase = require('../config/supabaseClient');

const DamageSymptomModel = {
    // Get relasi berdasarkan damage_id
    findByDamageId: async (damageId) => {
        const { data, error } = await supabase
            .from('damage_symptoms')
            .select('id, symptom_id, cf_value, is_mandatory')
            .eq('damage_id', damageId);
        if (error) throw error;
        return data;
    },

    // Tambah relasi baru
    create: async (data) => {
        const { data: result, error } = await supabase
            .from('damage_symptoms')
            .insert([data])
            .select()
            .single();
        if (error) throw error;
        return result;
    },

    // Update relasi
    update: async (id, updates) => {
        const { data, error } = await supabase
            .from('damage_symptoms')
            .update(updates)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // Hapus relasi
    delete: async (id) => {
        const { error } = await supabase
            .from('damage_symptoms')
            .delete()
            .eq('id', id);
        if (error) throw error;
        return true;
    }
};

module.exports = DamageSymptomModel;