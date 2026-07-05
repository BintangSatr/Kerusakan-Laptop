const AdminService = require('../services/adminService');

const AdminController = {
    // ============================================================
    // 1. DASHBOARD
    // ============================================================
    getStats: async (req, res) => {
        try {
            const stats = await AdminService.getStats();
            res.json(stats);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getChartData: async (req, res) => {
        try {
            const { type = 'daily' } = req.query;
            const data = await AdminService.getChartData(type);
            res.json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 2. USER MANAGEMENT
    // ============================================================
    getUsers: async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '', role = '' } = req.query;
            const result = await AdminService.getUsers(parseInt(page), parseInt(limit), search, role);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getUserById: async (req, res) => {
        try {
            const user = await AdminService.getUserById(parseInt(req.params.id));
            if (!user) return res.status(404).json({ error: 'User tidak ditemukan!' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createUser: async (req, res) => {
        try {
            const { username, email, password, full_name, role } = req.body;
            if (!username || !email || !password || !full_name) {
                return res.status(400).json({ error: 'Semua field wajib diisi!' });
            }
            const user = await AdminService.createUser({ username, email, password, full_name, role: role || 'user' });
            res.status(201).json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateUser: async (req, res) => {
        try {
            const { full_name, email, role, phone, profile_picture } = req.body;
            const user = await AdminService.updateUser(parseInt(req.params.id), {
                full_name,
                email,
                role,
                phone,
                profile_picture
            });
            res.json(user);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteUser: async (req, res) => {
        try {
            await AdminService.deleteUser(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { new_password } = req.body;
            if (!new_password) return res.status(400).json({ error: 'Password baru wajib diisi!' });
            await AdminService.resetPassword(parseInt(req.params.id), new_password);
            res.json({ message: 'Password berhasil direset!' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    toggleUserActive: async (req, res) => {
        try {
            const { is_active } = req.body;
            if (is_active === undefined) return res.status(400).json({ error: 'is_active wajib diisi!' });
            const user = await AdminService.toggleUserActive(parseInt(req.params.id), is_active);
            res.json({ message: `User ${is_active ? 'diaktifkan' : 'dinonaktifkan'}!`, data: user });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 3. SYMPTOM MANAGEMENT
    // ============================================================
    getSymptoms: async (req, res) => {
        try {
            const { page = 1, limit = 10, group = '' } = req.query;
            const result = await AdminService.getSymptoms(parseInt(page), parseInt(limit), group);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getSymptomById: async (req, res) => {
        try {
            const symptom = await AdminService.getSymptomById(parseInt(req.params.id));
            if (!symptom) return res.status(404).json({ error: 'Gejala tidak ditemukan!' });
            res.json(symptom);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createSymptom: async (req, res) => {
        try {
            const { code, name, description, cf_weight, symptom_group } = req.body;
            if (!code || !name) {
                return res.status(400).json({ error: 'code dan name wajib diisi!' });
            }
            const symptom = await AdminService.createSymptom({
                code,
                name,
                description,
                cf_weight: cf_weight || 1,
                symptom_group
            });
            res.status(201).json(symptom);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateSymptom: async (req, res) => {
        try {
            const symptom = await AdminService.updateSymptom(parseInt(req.params.id), req.body);
            res.json(symptom);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteSymptom: async (req, res) => {
        try {
            await AdminService.deleteSymptom(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 4. DAMAGE MANAGEMENT
    // ============================================================
    getDamages: async (req, res) => {
        try {
            const { page = 1, limit = 10, severity = '' } = req.query;
            const result = await AdminService.getDamages(parseInt(page), parseInt(limit), severity);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getDamageById: async (req, res) => {
        try {
            const damage = await AdminService.getDamageById(parseInt(req.params.id));
            if (!damage) return res.status(404).json({ error: 'Kerusakan tidak ditemukan!' });
            res.json(damage);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createDamage: async (req, res) => {
        try {
            const { code, name, description, general_solution, severity_level } = req.body;
            if (!code || !name) {
                return res.status(400).json({ error: 'code dan name wajib diisi!' });
            }
            const damage = await AdminService.createDamage({
                code,
                name,
                description,
                general_solution,
                severity_level: severity_level || 'medium'
            });
            res.status(201).json(damage);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateDamage: async (req, res) => {
        try {
            const damage = await AdminService.updateDamage(parseInt(req.params.id), req.body);
            res.json(damage);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteDamage: async (req, res) => {
        try {
            await AdminService.deleteDamage(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 5. DAMAGE-SYMPTOM RELATIONSHIP
    // ============================================================
    getDamageSymptoms: async (req, res) => {
        try {
            const damageId = parseInt(req.params.damage_id);
            const rels = await AdminService.getDamageSymptoms(damageId);
            res.json(rels);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createDamageSymptom: async (req, res) => {
        try {
            const { damage_id, symptom_id, cf_value, is_mandatory } = req.body;
            if (!damage_id || !symptom_id || cf_value === undefined) {
                return res.status(400).json({ error: 'damage_id, symptom_id, dan cf_value wajib diisi!' });
            }
            const rel = await AdminService.createDamageSymptom({ damage_id, symptom_id, cf_value, is_mandatory: is_mandatory || false });
            res.status(201).json(rel);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateDamageSymptom: async (req, res) => {
        try {
            const rel = await AdminService.updateDamageSymptom(parseInt(req.params.id), req.body);
            res.json(rel);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteDamageSymptom: async (req, res) => {
        try {
            await AdminService.deleteDamageSymptom(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 6. SOLUTION MANAGEMENT
    // ============================================================
    getSolutions: async (req, res) => {
        try {
            const damageId = parseInt(req.params.damage_id);
            const solutions = await AdminService.getSolutions(damageId);
            res.json(solutions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createSolution: async (req, res) => {
        try {
            const { damage_id, step_order, description, is_preventive, requires_tools } = req.body;
            if (!damage_id || !step_order || !description) {
                return res.status(400).json({ error: 'damage_id, step_order, dan description wajib diisi!' });
            }
            const solution = await AdminService.createSolution({ damage_id, step_order, description, is_preventive, requires_tools });
            res.status(201).json(solution);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateSolution: async (req, res) => {
        try {
            const solution = await AdminService.updateSolution(parseInt(req.params.id), req.body);
            res.json(solution);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteSolution: async (req, res) => {
        try {
            await AdminService.deleteSolution(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 7. RULE MANAGEMENT (knowledge_base)
    // ============================================================
    getRules: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await AdminService.getRules(parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getRuleById: async (req, res) => {
        try {
            const rule = await AdminService.getRuleById(parseInt(req.params.id));
            if (!rule) return res.status(404).json({ error: 'Aturan tidak ditemukan!' });
            res.json(rule);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    createRule: async (req, res) => {
        try {
            const { rule_code, antecedent, consequent, cf_rule, description, priority } = req.body;
            if (!rule_code || !antecedent || !consequent || cf_rule === undefined) {
                return res.status(400).json({ error: 'rule_code, antecedent, consequent, dan cf_rule wajib diisi!' });
            }
            const rule = await AdminService.createRule({ rule_code, antecedent, consequent, cf_rule, description, priority });
            res.status(201).json(rule);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    updateRule: async (req, res) => {
        try {
            const rule = await AdminService.updateRule(parseInt(req.params.id), req.body);
            res.json(rule);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    deleteRule: async (req, res) => {
        try {
            await AdminService.deleteRule(parseInt(req.params.id));
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 8. CONSULTATION MONITORING
    // ============================================================
    getConsultations: async (req, res) => {
        try {
            const { page = 1, limit = 10, status = '', date_from = '', date_to = '' } = req.query;
            const result = await AdminService.getConsultations(parseInt(page), parseInt(limit), status, date_from, date_to);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getConsultationById: async (req, res) => {
        try {
            const consultation = await AdminService.getConsultationById(parseInt(req.params.id));
            if (!consultation) return res.status(404).json({ error: 'Konsultasi tidak ditemukan!' });
            res.json(consultation);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getConsultationResults: async (req, res) => {
        try {
            const results = await AdminService.getConsultationResults(parseInt(req.params.id));
            if (!results) return res.status(404).json({ error: 'Hasil konsultasi tidak ditemukan!' });
            res.json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 9. LOGS
    // ============================================================
    getLogs: async (req, res) => {
        try {
            const { page = 1, limit = 10, action = '', user_id = '' } = req.query;
            const result = await AdminService.getLogs(parseInt(page), parseInt(limit), action, user_id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 10. FEEDBACK
    // ============================================================
    getFeedback: async (req, res) => {
        try {
            const { page = 1, limit = 10, is_correct = '' } = req.query;
            const result = await AdminService.getFeedback(parseInt(page), parseInt(limit), is_correct);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 11. ANALYTICS
    // ============================================================
    getAccuracy: async (req, res) => {
        try {
            const { date_from = '', date_to = '', damage_id = '' } = req.query;
            const result = await AdminService.getAccuracy(date_from, date_to, damage_id);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getTopDamages: async (req, res) => {
        try {
            const { date_from = '', date_to = '', limit = 10 } = req.query;
            const result = await AdminService.getTopDamages(date_from, date_to, parseInt(limit));
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 12. NOTIFICATIONS (BROADCAST)
    // ============================================================
    getNotifications: async (req, res) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const result = await AdminService.getNotifications(parseInt(page), parseInt(limit));
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    sendBroadcast: async (req, res) => {
        try {
            const { title, message, target = 'all' } = req.body;
            if (!title || !message) {
                return res.status(400).json({ error: 'title dan message wajib diisi!' });
            }

            const result = await AdminService.sendBroadcast(title, message, target, req.user.id);
            res.status(201).json({
                message: 'Notifikasi berhasil dikirim!',
                data: result
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = AdminController;