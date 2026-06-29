// services/diagnosisService.js
const supabase = require('../config/supabaseClient');
const SymptomModel = require('../models/symptomModel');
const DamageModel = require('../models/damageModel');
const RuleModel = require('../models/ruleModel');
const ConsultationModel = require('../models/consultationModel');

const DiagnosisService = {
    // ============================================================
    // 1. GET SYMPTOMS, DAMAGES, SOLUTIONS, START
    // ============================================================
    getSymptoms: async (group = null) => {
        return await SymptomModel.findAll({ group, is_active: true });
    },

    getDamages: async () => {
        return await DamageModel.findAll({ is_active: true });
    },

    getDamageSolutions: async (damageId) => {
        return await DamageModel.getSolutions(damageId);
    },

    startConsultation: async (userId = null, isGuest = false, guestSessionId = null) => {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        const consultation = await ConsultationModel.create({
            user_id: userId,
            session_id: sessionId,
            status: 'in_progress',
            is_guest: isGuest,
            guest_session_id: guestSessionId,
            selected_symptoms: [],
            results: [],
            answered_symptoms: [],
            answered_count: 0,
            current_step: 0
        });
        return consultation;
    },

    // ============================================================
    // 2. INTERACTIVE Q&A
    // ============================================================
    getNextQuestion: async (consultationId) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');

        if (consultation.status === 'completed') {
            return { status: 'completed', message: 'Diagnosis sudah selesai.' };
        }

        const symptoms = await SymptomModel.findAll({ is_active: true });
        const answeredSymptoms = consultation.answered_symptoms || [];
        const answeredIds = answeredSymptoms.map(s => s.symptom_id);
        const unAnsweredSymptoms = symptoms.filter(s => !answeredIds.includes(s.id));

        if (unAnsweredSymptoms.length === 0) {
            // Jika semua gejala sudah dijawab, proses diagnosis otomatis
            const result = await DiagnosisService.processFinalDiagnosis(consultationId);
            return {
                status: 'completed',
                message: 'Diagnosis selesai!',
                result
            };
        }

        const nextSymptom = unAnsweredSymptoms[0];
        return {
            status: 'question',
            question_number: consultation.answered_count + 1,
            total_questions: symptoms.length,
            symptom: {
                id: nextSymptom.id,
                code: nextSymptom.code,
                name: nextSymptom.name,
                group: nextSymptom.symptom_group,
                description: nextSymptom.description
            },
            options: ['yes', 'probably_yes', 'dont_know', 'probably_not', 'no']
        };
    },

    answerQuestion: async (consultationId, symptomId, answerValue) => {
        const validAnswers = ['yes', 'probably_yes', 'dont_know', 'probably_not', 'no'];
        if (!validAnswers.includes(answerValue)) {
            throw new Error('Jawaban tidak valid. Pilih: yes, probably_yes, dont_know, probably_not, no');
        }

        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');
        if (consultation.status === 'completed') {
            throw new Error('Konsultasi sudah selesai!');
        }

        const answeredSymptoms = consultation.answered_symptoms || [];
        if (answeredSymptoms.some(s => s.symptom_id === symptomId)) {
            throw new Error('Gejala ini sudah dijawab sebelumnya!');
        }

        const newAnswered = [...answeredSymptoms, { symptom_id: symptomId, value: answerValue }];
        const newCount = (consultation.answered_count || 0) + 1;

        await ConsultationModel.updateAnsweredSymptoms(consultationId, newAnswered, newCount);

        return await DiagnosisService.getNextQuestion(consultationId);
    },

    // ============================================================
    // 3. PROSES DIAGNOSIS AKHIR (CF PAKAR × CF USER + KOMBINASI)
    //    Metode Standar Shortliffe & Buchanan
    // ============================================================
    processFinalDiagnosis: async (consultationId) => {
        // 1. Ambil data konsultasi (termasuk jawaban user)
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');

        // 2. Mapping jawaban user ke CF User
        const getUserCF = (answerValue) => {
            const map = {
                'yes': 1.0,
                'probably_yes': 0.8,
                'dont_know': 0.4,
                'probably_not': 0.2,
                'no': 0.0
            };
            return map[answerValue] || 0;
        };

        // 3. Buat object jawaban user: { symptom_id: cf_user, ... }
        const userAnswers = {};
        const answeredSymptoms = consultation.answered_symptoms || [];
        for (const ans of answeredSymptoms) {
            userAnswers[ans.symptom_id] = getUserCF(ans.value);
        }

        // 4. Ambil semua aturan aktif
        const rules = await RuleModel.findAll({ is_active: true });

        // 5. Ambil relasi damage-symptoms (CF Pakar)
        const { data: damageSymptoms } = await supabase
            .from('damage_symptoms')
            .select('damage_id, symptom_id, cf_value, is_mandatory');

        // 6. Proses setiap aturan
        const cfResults = {};

        for (const rule of rules) {
            const antecedent = rule.antecedent; // [{symptom_id: ...}, ...]
            const consequent = rule.consequent; // [{damage_id: ..., cf: ...}, ...]

            // Cek apakah semua gejala di antecedent sudah dijawab user
            const allAnswered = antecedent.every(cond => userAnswers[cond.symptom_id] !== undefined);
            if (!allAnswered) continue;

            // --- Hitung CF Combine untuk aturan ini ---
            let cfCombined = 0;
            for (const cond of antecedent) {
                const symptomId = cond.symptom_id;

                // Cari CF Pakar untuk gejala ini pada damage yang bersangkutan
                let cfExpert = 0;
                for (const cons of consequent) {
                    const found = damageSymptoms.find(
                        ds => ds.damage_id === cons.damage_id && ds.symptom_id === symptomId
                    );
                    if (found) {
                        cfExpert = found.cf_value;
                        break;
                    }
                }

                const cfUser = userAnswers[symptomId] || 0;
                const cfItem = cfExpert * cfUser; // CF Pakar × CF User

                // Rumus Kombinasi: CF_old + CF_new * (1 - CF_old)
                cfCombined = cfCombined + cfItem * (1 - cfCombined);
            }

            // --- Kalikan dengan CF Rule ---
            for (const cons of consequent) {
                const damageId = cons.damage_id;
                const cfRule = cons.cf || rule.cf_rule || 1.0;
                const finalCF = cfCombined * cfRule;

                if (!cfResults[damageId] || cfResults[damageId] < finalCF) {
                    cfResults[damageId] = finalCF;
                }
            }
        }

        // 7. Urutkan hasil dari CF tertinggi
        const sortedResults = Object.entries(cfResults)
            .map(([damageId, cf]) => ({ damage_id: parseInt(damageId), cf }))
            .sort((a, b) => b.cf - a.cf);

        // 8. Ambil detail kerusakan
        const damageIds = sortedResults.map(r => r.damage_id);
        let damages = [];
        if (damageIds.length > 0) {
            const { data } = await supabase
                .from('damages')
                .select('*')
                .in('id', damageIds);
            damages = data;
        }

        // 9. Format hasil (confidence dalam persen)
        const results = sortedResults.map(r => ({
            damage: damages.find(d => d.id === r.damage_id),
            confidence: parseFloat((r.cf * 100).toFixed(2))
        }));

        // 10. Update konsultasi menjadi completed
        await ConsultationModel.completeConsultation(consultationId, results);

        return {
            consultation_id: consultationId,
            results,
            summary: {
                total_rules_matched: Object.keys(cfResults).length,
                total_damages_found: results.length
            }
        };
    },

    // ============================================================
    // 4. PROCESS DIAGNOSIS (KOMPATIBILITAS DENGAN OLD API)
    //    Tetap menerima symptom_ids, tetapi mengabaikannya dan
    //    membaca jawaban dari answered_symptoms.
    // ============================================================
    processDiagnosis: async (consultationId, symptomIds) => {
        // Panggil processFinalDiagnosis yang sudah menggunakan answered_symptoms
        return await DiagnosisService.processFinalDiagnosis(consultationId);
    },

    // ============================================================
    // 5. GET RESULT
    // ============================================================
    getResult: async (consultationId) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');
        return consultation;
    },

    // ============================================================
    // 6. FEEDBACK
    // ============================================================
    submitFeedback: async (consultationId, isCorrect, actualDamageId = null) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');
        if (consultation.status !== 'completed') {
            throw new Error('Konsultasi belum selesai. Selesaikan diagnosis terlebih dahulu!');
        }

        if (actualDamageId) {
            const damage = await DamageModel.findById(actualDamageId);
            if (!damage) throw new Error('Kerusakan tidak ditemukan!');
        }

        const { data, error } = await supabase
            .from('feedback')
            .insert([{
                consultation_id: consultationId,
                is_correct: isCorrect,
                actual_damage_id: actualDamageId || null
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};

module.exports = DiagnosisService;