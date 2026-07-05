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
    // 1. DASHBOARD
    // ============================================================
    getStats: async () => {
        const { count: users } = await supabase.from('users').select('*', { count: 'exact', head: true });
        const { count: symptoms } = await supabase.from('symptoms').select('*', { count: 'exact', head: true });
        const { count: damages } = await supabase.from('damages').select('*', { count: 'exact', head: true });
        const { count: consultations } = await supabase.from('consultations').select('*', { count: 'exact', head: true });
        const { count: feedback } = await supabase.from('feedback').select('*', { count: 'exact', head: true });
        return { users, symptoms, damages, consultations, feedback };
    },

    getChartData: async (type = 'daily') => {
        const now = new Date();
        let startDate;

        switch (type) {
            case 'daily':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
                break;
            case 'weekly':
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 12 * 7);
                break;
            case 'monthly':
                startDate = new Date(now);
                startDate.setMonth(startDate.getMonth() - 12);
                break;
            default:
                startDate = new Date(now);
                startDate.setDate(startDate.getDate() - 30);
        }

        const { data, error } = await supabase
            .from('consultations')
            .select('created_at, status')
            .gte('created_at', startDate.toISOString());

        if (error) throw error;

        const grouped = {};
        data.forEach(item => {
            const date = new Date(item.created_at);
            let key;
            if (type === 'daily') {
                key = date.toISOString().split('T')[0];
            } else if (type === 'weekly') {
                const week = Math.floor((date - startDate) / (7 * 24 * 60 * 60 * 1000));
                key = `Week ${week + 1}`;
            } else {
                key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }
            if (!grouped[key]) grouped[key] = { total: 0, completed: 0, cancelled: 0 };
            grouped[key].total++;
            if (item.status === 'completed') grouped[key].completed++;
            if (item.status === 'cancelled') grouped[key].cancelled++;
        });

        const labels = Object.keys(grouped).sort();
        return {
            labels,
            datasets: [
                { label: 'Total Konsultasi', data: labels.map(k => grouped[k].total) },
                { label: 'Selesai', data: labels.map(k => grouped[k].completed) },
                { label: 'Dibatalkan', data: labels.map(k => grouped[k].cancelled) }
            ]
        };
    },

    // ============================================================
    // 2. USER MANAGEMENT
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
    // 3. SYMPTOM MANAGEMENT
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
    // 4. DAMAGE MANAGEMENT
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
    // 5. DAMAGE-SYMPTOM RELATIONSHIP
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
    // 6. SOLUTION MANAGEMENT
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
    // 7. RULE MANAGEMENT (knowledge_base)
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
    // 8. CONSULTATION MONITORING
    // ============================================================
    getConsultations: async (page, limit, status, dateFrom, dateTo) => {
        return await ConsultationModel.findAllAdmin(page, limit, status, dateFrom, dateTo);
    },

    getConsultationById: async (id) => {
        return await ConsultationModel.findById(id);
    },

    getConsultationResults: async (consultationId) => {
        return await ConsultationModel.getResults(consultationId);
    },

    // ============================================================
    // 9. LOGS
    // ============================================================
    getLogs: async (page, limit, action, userId) => {
        const LogModel = require('../models/logModel');
        return await LogModel.findAll(page, limit, action, userId);
    },

    // ============================================================
    // 10. FEEDBACK
    // ============================================================
    getFeedback: async (page, limit, isCorrect) => {
        const FeedbackModel = require('../models/feedbackModel');
        return await FeedbackModel.findAllAdmin(page, limit, isCorrect);
    },

    // ============================================================
    // 11. ANALYTICS
    // ============================================================
    getAccuracy: async (dateFrom, dateTo, damageId = null) => {
        let query = supabase
            .from('feedback')
            .select(`
                *,
                consultations (
                    created_at,
                    user_id
                ),
                damages (
                    id,
                    name,
                    code
                )
            `)
            .not('consultations', 'is', null);

        if (dateFrom) query = query.gte('consultations.created_at', dateFrom);
        if (dateTo) query = query.lte('consultations.created_at', dateTo);
        if (damageId) query = query.eq('actual_damage_id', parseInt(damageId));

        const { data, error } = await query;
        if (error) throw error;

        const total = data.length;
        const correct = data.filter(f => f.is_correct === true).length;
        const accuracy = total > 0 ? (correct / total) * 100 : 0;

        const byDamage = {};
        data.forEach(f => {
            const damage = f.damages;
            const name = damage?.name || 'Tidak diketahui';
            if (!byDamage[name]) byDamage[name] = { total: 0, correct: 0 };
            byDamage[name].total++;
            if (f.is_correct) byDamage[name].correct++;
        });

        const damageStats = Object.entries(byDamage).map(([name, stats]) => ({
            damage: name,
            total: stats.total,
            correct: stats.correct,
            accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
        }));

        return {
            total_feedback: total,
            correct_feedback: correct,
            accuracy: parseFloat(accuracy.toFixed(2)),
            by_damage: damageStats
        };
    },

    getTopDamages: async (dateFrom, dateTo, limit = 10) => {
        let query = supabase
            .from('diagnosis_results')
            .select(`
                damage_id,
                damages (
                    id,
                    name,
                    code
                )
            `);

        if (dateFrom) query = query.gte('diagnosis_date', dateFrom);
        if (dateTo) query = query.lte('diagnosis_date', dateTo);

        const { data, error } = await query;
        if (error) throw error;

        // 🔥 FIX: Jika data null atau undefined, return array kosong
        if (!data || data.length === 0) return [];

        const countMap = {};
        data.forEach(item => {
            const damage = item.damages;
            if (!damage) return;
            const key = damage.id;
            if (!countMap[key]) {
                countMap[key] = {
                    id: key,
                    name: damage.name || 'Tidak diketahui',
                    code: damage.code || '-',
                    count: 0
                };
            }
            countMap[key].count++;
        });

        return Object.values(countMap)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit);
    },

    // ============================================================
    // 12. NOTIFICATIONS (BROADCAST)
    // ============================================================
    getNotifications: async (page, limit) => {
        const NotificationModel = require('../models/notificationModel');
        return await NotificationModel.findAll(page, limit);
    },

    sendBroadcast: async (title, message, target, adminId) => {
        const NotificationModel = require('../models/notificationModel');
        const notification = await NotificationModel.create(title, message, target, adminId);
        return notification;
    }
};

module.exports = AdminService;