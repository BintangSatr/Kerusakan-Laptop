// services/diagnosisService.js
const supabase = require('../config/supabaseClient');
const SymptomModel = require('../models/symptomModel');
const DamageModel = require('../models/damageModel');
const RuleModel = require('../models/ruleModel');
const ConsultationModel = require('../models/consultationModel');

const DiagnosisService = {
    // ============================================================
    // 1. PUBLIC DATA
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

    getSymptomDetail: async (id) => {
        const symptom = await SymptomModel.findById(id);
        if (!symptom) throw new Error('Gejala tidak ditemukan!');
        return symptom;
    },

    getDamageDetail: async (id) => {
        const damage = await DamageModel.findById(id);
        if (!damage) throw new Error('Kerusakan tidak ditemukan!');
        return damage;
    },

    // ============================================================
    // 2. KONSULTASI
    // ============================================================
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

    cancelConsultation: async (consultationId, userId = null, guestSessionId = null) => {
        return await ConsultationModel.cancel(consultationId, userId, guestSessionId);
    },

    getResult: async (consultationId) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');
        return consultation;
    },

    // ============================================================
    // 3. INTERACTIVE Q&A
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
    // 4. PROSES DIAGNOSIS (CF PAKAR × CF USER + KOMBINASI)
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
        if (answeredSymptoms.length === 0) {
            throw new Error('Belum ada gejala yang dijawab!');
        }
        for (const ans of answeredSymptoms) {
            userAnswers[ans.symptom_id] = getUserCF(ans.value);
        }

        // 4. Ambil semua aturan aktif
        const rules = await RuleModel.findAll({ is_active: true });
        if (rules.length === 0) {
            throw new Error('Tidak ada aturan aktif di database!');
        }

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
    // 5. PROCESS DIAGNOSIS (KOMPATIBILITAS)
    // ============================================================
    processDiagnosis: async (consultationId, symptomIds) => {
        // 1. Ambil data konsultasi
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');

        // 2. Jika ada symptom_ids yang dikirim, ubah menjadi answered_symptoms
        if (symptomIds && symptomIds.length > 0) {
            // Buat answered_symptoms dari symptom_ids (anggap semua jawaban = "yes")
            const answeredSymptoms = symptomIds.map(id => ({
                symptom_id: id,
                value: 'yes'
            }));

            // Simpan ke database
            await ConsultationModel.update(consultationId, {
                answered_symptoms: answeredSymptoms,
                answered_count: answeredSymptoms.length
            });
        }

        // 3. Proses diagnosis (baca dari answered_symptoms)
        return await DiagnosisService.processFinalDiagnosis(consultationId);
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
    },

    // ============================================================
    // 7. EXPORT PDF
    // ============================================================
    exportPDF: async (consultationId) => {
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) throw new Error('Konsultasi tidak ditemukan!');
        if (consultation.status !== 'completed') {
            throw new Error('Konsultasi belum selesai. Selesaikan diagnosis terlebih dahulu!');
        }

        const results = consultation.results || [];
        if (results.length === 0) {
            throw new Error('Tidak ada hasil diagnosis untuk diexport!');
        }

        // === GENERATE PDF ===
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {});

        // --- Header ---
        doc.fontSize(20).font('Helvetica-Bold').text('LAPORAN DIAGNOSIS KERUSAKAN LAPTOP', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).font('Helvetica');
        doc.text(`ID Konsultasi: ${consultationId}`);
        doc.text(`Tanggal: ${new Date(consultation.created_at).toLocaleString('id-ID')}`);
        doc.text(`Status: ${consultation.status}`);
        doc.moveDown();

        // --- Gejala yang Dipilih ---
        const selectedSymptoms = consultation.selected_symptoms || [];
        if (selectedSymptoms.length > 0) {
            doc.fontSize(14).font('Helvetica-Bold').text('Gejala yang Dipilih:');
            doc.fontSize(11).font('Helvetica');
            const symptomIds = selectedSymptoms.map(s => s.symptom_id);
            const { data: symptoms } = await supabase
                .from('symptoms')
                .select('id, name')
                .in('id', symptomIds);
            
            if (symptoms) {
                symptoms.forEach((s, i) => {
                    doc.text(`${i+1}. ${s.name}`);
                });
            }
            doc.moveDown();
        }

        // --- Hasil Diagnosis ---
        doc.fontSize(14).font('Helvetica-Bold').text('Hasil Diagnosis:');
        doc.moveDown();

        results.forEach((item, index) => {
            const damage = item.damage;
            const confidence = item.confidence || 0;
            const level = confidence >= 80 ? 'Sangat Tinggi' :
                          confidence >= 60 ? 'Tinggi' :
                          confidence >= 40 ? 'Sedang' : 'Rendah';

            doc.fontSize(12).font('Helvetica-Bold');
            doc.text(`${index+1}. ${damage.name} (${damage.code})`);
            doc.fontSize(10).font('Helvetica');
            doc.text(`   Keyakinan: ${confidence}% (${level})`);
            doc.text(`   Deskripsi: ${damage.description || '-'}`);
            doc.text(`   Tingkat Severitas: ${damage.severity_level || '-'}`);
            if (damage.general_solution) {
                doc.text(`   Solusi Umum: ${damage.general_solution}`);
            }
            doc.moveDown(0.5);
        });

        // --- Footer ---
        doc.moveDown(2);
        doc.fontSize(9).font('Helvetica');
        doc.text('Dokumen ini dihasilkan oleh Sistem Pakar Diagnosis Kerusakan Laptop (Laptop Akinator).', { align: 'center' });
        doc.text('*Hasil diagnosis bersifat rekomendasi, bukan pengganti pemeriksaan teknisi profesional.', { align: 'center' });

        doc.end();

        return new Promise((resolve) => {
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });
    },
};

module.exports = DiagnosisService;