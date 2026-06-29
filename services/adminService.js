// services/adminService.js
const supabase = require('../config/supabaseClient');
const UserModel = require('../models/userModel');
const SymptomModel = require('../models/symptomModel');
const DamageModel = require('../models/damageModel');
const RuleModel = require('../models/ruleModel');
const DamageSymptomModel = require('../models/damageSymptomModel');
const SolutionModel = require('../models/solutionModel');
const ConsultationModel = require('../models/consultationModel');

const AdminService = {
    // ============================================================
    // DASHBOARD
    // ============================================================
    getStats: async () => {
        const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: symptoms } = await supabase.from('symptoms').select('*', { count: 'exact', head: true });
        const { count: damages } = await supabase.from('damages').select('*', { count: 'exact', head: true });
        const { count: consultations } = await supabase.from('consultations').select('*', { count: 'exact', head: true });
        const { count: feedback } = await supabase.from('feedback').select('*', { count: 'exact', head: true });
        return { users, symptoms, damages, consultations, feedback };
    },

    // ============================================================
    // USER MANAGEMENT
    // ============================================================
    getUsers: async (page, limit, search, role) => {
        return await UserModel.findAllAdmin(page, limit, search, role);
    },

    getUserById: async (id) => {
        return await UserModel.findById(id);
    },

    createUser: async (userData) => {
        return await UserModel.create(userData);
    },

    updateUser: async (id, updates) => {
        const allowed = ['full_name', 'email', 'role', 'phone', 'profile_picture'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await UserModel.update(id, filtered);
    },

    deleteUser: async (id) => {
        return await UserModel.toggleActive(id, false);
    },

    resetPassword: async (id, newPassword) => {
        return await UserModel.resetPassword(id, newPassword);
    },

    toggleUserActive: async (id, isActive) => {
        return await UserModel.toggleActive(id, isActive);
    },

    // ============================================================
    // SYMPTOM MANAGEMENT
    // ============================================================
    getSymptoms: async (page, limit, group) => {
        return await SymptomModel.findAllAdmin(page, limit, group);
    },

    getSymptomById: async (id) => {
        return await SymptomModel.findById(id);
    },

    createSymptom: async (data) => {
        return await SymptomModel.create(data);
    },

    updateSymptom: async (id, updates) => {
        const allowed = ['code', 'name', 'description', 'cf_weight', 'symptom_group', 'is_active'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await SymptomModel.update(id, filtered);
    },

    deleteSymptom: async (id) => {
        return await SymptomModel.deleteAdmin(id);
    },

    // ============================================================
    // DAMAGE MANAGEMENT
    // ============================================================
    getDamages: async (page, limit, severity) => {
        return await DamageModel.findAllAdmin(page, limit, severity);
    },

    getDamageById: async (id) => {
        return await DamageModel.findById(id);
    },

    createDamage: async (data) => {
        return await DamageModel.create(data);
    },

    updateDamage: async (id, updates) => {
        const allowed = ['code', 'name', 'description', 'general_solution', 'severity_level', 'is_active'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await DamageModel.update(id, filtered);
    },

    deleteDamage: async (id) => {
        return await DamageModel.deleteAdmin(id);
    },

    // ============================================================
    // DAMAGE-SYMPTOM RELATIONSHIP
    // ============================================================
    getDamageSymptoms: async (damageId) => {
        return await DamageSymptomModel.findByDamageId(damageId);
    },

    createDamageSymptom: async (data) => {
        const { damage_id, symptom_id, cf_value, is_mandatory } = data;
        if (!damage_id || !symptom_id || cf_value === undefined) {
            throw new Error('damage_id, symptom_id, dan cf_value wajib diisi!');
        }
        return await DamageSymptomModel.create({ damage_id, symptom_id, cf_value, is_mandatory: is_mandatory || false });
    },

    updateDamageSymptom: async (id, updates) => {
        const allowed = ['cf_value', 'is_mandatory'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await DamageSymptomModel.update(id, filtered);
    },

    deleteDamageSymptom: async (id) => {
        return await DamageSymptomModel.delete(id);
    },

    // ============================================================
    // SOLUTION MANAGEMENT
    // ============================================================
    getSolutions: async (damageId) => {
        return await SolutionModel.findByDamageId(damageId);
    },

    createSolution: async (data) => {
        const { damage_id, step_order, description, is_preventive, requires_tools } = data;
        if (!damage_id || !step_order || !description) {
            throw new Error('damage_id, step_order, dan description wajib diisi!');
        }
        return await SolutionModel.create(data);
    },

    updateSolution: async (id, updates) => {
        const allowed = ['step_order', 'description', 'is_preventive', 'requires_tools'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await SolutionModel.update(id, filtered);
    },

    deleteSolution: async (id) => {
        return await SolutionModel.delete(id);
    },

    // ============================================================
    // RULE MANAGEMENT (knowledge_base)
    // ============================================================
    getRules: async (page, limit) => {
        return await RuleModel.findAllAdmin(page, limit);
    },

    getRuleById: async (id) => {
        return await RuleModel.findById(id);
    },

    createRule: async (data) => {
        const { rule_code, antecedent, consequent, cf_rule, description, priority } = data;
        if (!rule_code || !antecedent || !consequent || cf_rule === undefined) {
            throw new Error('rule_code, antecedent, consequent, dan cf_rule wajib diisi!');
        }
        return await RuleModel.create(data);
    },

    updateRule: async (id, updates) => {
        const allowed = ['rule_code', 'antecedent', 'consequent', 'cf_rule', 'description', 'priority', 'is_active'];
        const filtered = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) filtered[key] = updates[key];
        }
        if (Object.keys(filtered).length === 0) throw new Error('Tidak ada field yang diupdate!');
        return await RuleModel.update(id, filtered);
    },

    deleteRule: async (id) => {
        return await RuleModel.deleteAdmin(id);
    },

    // ============================================================
    // CONSULTATION MONITORING
    // ============================================================
    getConsultations: async (page, limit, status, dateFrom, dateTo) => {
        return await ConsultationModel.findAllAdmin(page, limit, status, dateFrom, dateTo);
    },

    getConsultationById: async (id) => {
        return await ConsultationModel.findById(id);
    },

    getConsultationResults: async (consultationId) => {
        return await ConsultationModel.getResults(consultationId);
    }
};

module.exports = AdminService;