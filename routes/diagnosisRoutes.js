// routes/diagnosisRoutes.js
const express = require('express');
const router = express.Router();
const DiagnosisController = require('../controllers/diagnosisController');
const authMiddleware = require('../middlewares/auth');

// ============================================================
// PUBLIC ROUTES (TIDAK PERLU LOGIN)
// ============================================================
router.get('/symptoms', DiagnosisController.getSymptoms);
router.get('/damages', DiagnosisController.getDamages);
router.get('/damages/:id/solutions', DiagnosisController.getDamageSolutions);

// ============================================================
// START CONSULTATION (BISA UNTUK GUEST ATAU USER)
// ============================================================
router.post('/start', DiagnosisController.startConsultation); // <-- TANPA authMiddleware!

// ============================================================
// PROTECTED ROUTES (WAJIB LOGIN)
// ============================================================
router.get('/:id/next-question', DiagnosisController.getNextQuestion); // <-- tanpa authMiddleware
router.post('/:id/answer', DiagnosisController.answerQuestion); // <-- tanpa authMiddleware
router.post('/process', DiagnosisController.processDiagnosis);
router.get('/:id/result', authMiddleware, DiagnosisController.getResult);
router.post('/:id/feedback', authMiddleware, DiagnosisController.submitFeedback);

module.exports = router;