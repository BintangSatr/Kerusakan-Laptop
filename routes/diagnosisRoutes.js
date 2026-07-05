// routes/diagnosisRoutes.js
const express = require('express');
const router = express.Router();
const DiagnosisController = require('../controllers/diagnosisController');
const authMiddleware = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth'); 

// ============================================================
// PUBLIC ROUTES (TIDAK PERLU LOGIN)
// ============================================================
router.get('/symptoms', DiagnosisController.getSymptoms);
router.get('/damages', DiagnosisController.getDamages);
router.get('/damages/:id/solutions', DiagnosisController.getDamageSolutions);

// ============================================================
// START CONSULTATION (BISA UNTUK GUEST ATAU USER)
// ============================================================
router.post('/start', optionalAuth, DiagnosisController.startConsultation);     

// ============================================================
// PROTECTED ROUTES (WAJIB LOGIN)
// ============================================================
router.get('/:id/next-question', DiagnosisController.getNextQuestion); // <-- tanpa authMiddleware
router.post('/:id/answer', DiagnosisController.answerQuestion); // <-- tanpa authMiddleware
router.post('/process', DiagnosisController.processDiagnosis);
router.get('/:id/result', authMiddleware, DiagnosisController.getResult);
router.post('/:id/feedback', authMiddleware, DiagnosisController.submitFeedback);

// routes/diagnosisRoutes.js (tambahkan di dalam router)

// ============================================================
// DETAIL GEJALA & KERUSAKAN (PUBLIC)
// ============================================================
router.get('/symptoms/:id', DiagnosisController.getSymptomDetail);
router.get('/damages/:id', DiagnosisController.getDamageDetail);

// ============================================================
// EXPORT PDF & CANCEL (PROTECTED)
// ============================================================
router.get('/:id/export-pdf', authMiddleware, DiagnosisController.exportPDF);
router.delete('/:id', authMiddleware, DiagnosisController.cancelConsultation);

module.exports = router;