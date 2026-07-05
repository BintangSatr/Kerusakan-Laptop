// controllers/diagnosisController.js
const DiagnosisService = require('../services/diagnosisService');

const DiagnosisController = {
    // ============================================================
    // 1. GET SYMPTOMS & DAMAGES (PUBLIC)
    // ============================================================
    getSymptoms: async (req, res) => {
        try {
            const { group } = req.query;
            const symptoms = await DiagnosisService.getSymptoms(group);
            res.json(symptoms);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getDamages: async (req, res) => {
        try {
            const damages = await DiagnosisService.getDamages();
            res.json(damages);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getDamageSolutions: async (req, res) => {
        try {
            const damageId = parseInt(req.params.id);
            const solutions = await DiagnosisService.getDamageSolutions(damageId);
            res.json(solutions);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 2. START CONSULTATION
    // ============================================================
    startConsultation: async (req, res) => {
        try {
            const body = req.body || {};
            const userId = req.user ? req.user.id : null;
            const isGuest = !req.user;
            const guestSessionId = body.guest_session_id || null;

            const consultation = await DiagnosisService.startConsultation(userId, isGuest, guestSessionId);
            res.status(201).json(consultation);
        } catch (error) {
            console.error('Start consultation error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 3. INTERACTIVE Q&A
    // ============================================================
    getNextQuestion: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);

            const consultation = await DiagnosisService.getResult(consultationId);
            if (!consultation) {
                return res.status(404).json({ error: 'Konsultasi tidak ditemukan!' });
            }

            if (req.user) {
                if (consultation.user_id !== req.user.id) {
                    return res.status(403).json({ error: 'Anda tidak memiliki akses ke konsultasi ini!' });
                }
            } else {
                if (!consultation.is_guest) {
                    return res.status(403).json({ error: 'Konsultasi ini memerlukan login!' });
                }
            }

            const result = await DiagnosisService.getNextQuestion(consultationId);
            res.json(result);
        } catch (error) {
            console.error('GetNextQuestion error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    answerQuestion: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const { symptom_id, answer_value } = req.body;

            if (!symptom_id || !answer_value) {
                return res.status(400).json({
                    error: 'symptom_id dan answer_value wajib diisi!'
                });
            }

            const consultation = await DiagnosisService.getResult(consultationId);
            if (!consultation) {
                return res.status(404).json({ error: 'Konsultasi tidak ditemukan!' });
            }

            if (req.user) {
                if (consultation.user_id !== req.user.id) {
                    return res.status(403).json({ error: 'Anda tidak memiliki akses ke konsultasi ini!' });
                }
            } else {
                if (!consultation.is_guest) {
                    return res.status(403).json({ error: 'Konsultasi ini memerlukan login!' });
                }
            }

            const result = await DiagnosisService.answerQuestion(consultationId, symptom_id, answer_value);
            res.json(result);
        } catch (error) {
            console.error('AnswerQuestion error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 4. PROCESS DIAGNOSIS
    // ============================================================
    processDiagnosis: async (req, res) => {
        try {
            const { consultation_id, symptom_ids } = req.body;

            if (!consultation_id) {
                return res.status(400).json({ error: 'consultation_id wajib diisi!' });
            }

            if (symptom_ids !== undefined && !Array.isArray(symptom_ids)) {
                return res.status(400).json({ error: 'symptom_ids harus berupa array!' });
            }

            const result = await DiagnosisService.processDiagnosis(consultation_id, symptom_ids || []);
            res.json(result);
        } catch (error) {
            console.error('ProcessDiagnosis error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 5. GET RESULT
    // ============================================================
    getResult: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const consultation = await DiagnosisService.getResult(consultationId);
            if (!consultation) {
                return res.status(404).json({ error: 'Konsultasi tidak ditemukan!' });
            }
            res.json(consultation);
        } catch (error) {
            console.error('GetResult error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 6. FEEDBACK
    // ============================================================
    submitFeedback: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const { is_correct, actual_damage_id } = req.body;

            if (is_correct === undefined) {
                return res.status(400).json({ error: 'is_correct wajib diisi!' });
            }

            const result = await DiagnosisService.submitFeedback(consultationId, is_correct, actual_damage_id);
            res.json({
                message: 'Terima kasih atas feedback-nya!',
                data: result
            });
        } catch (error) {
            console.error('SubmitFeedback error:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // ============================================================
    // 7. DETAIL GEJALA
    // ============================================================
    getSymptomDetail: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const symptom = await DiagnosisService.getSymptomDetail(id);
            res.json(symptom);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    },

    // ============================================================
    // 8. DETAIL KERUSAKAN
    // ============================================================
    getDamageDetail: async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            const damage = await DiagnosisService.getDamageDetail(id);
            res.json(damage);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    },

    // ============================================================
    // 9. BATALKAN KONSULTASI
    // ============================================================
    cancelConsultation: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const userId = req.user ? req.user.id : null;
            
            // Jika user login, langsung pakai userId, guest tidak bisa hapus lewat sini
            if (!userId) {
                return res.status(401).json({ error: 'Anda harus login untuk membatalkan konsultasi!' });
            }

            const result = await DiagnosisService.cancelConsultation(consultationId, userId);
            res.json({ message: 'Konsultasi berhasil dibatalkan!', data: result });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // ============================================================
    // 10. EXPORT PDF
    // ============================================================
    exportPDF: async (req, res) => {
        try {
            const consultationId = parseInt(req.params.id);
            const pdfBuffer = await DiagnosisService.exportPDF(consultationId);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=diagnosis_${consultationId}.pdf`);
            res.send(pdfBuffer);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },
};

module.exports = DiagnosisController;