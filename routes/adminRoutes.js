const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// ============================================================
// SEMUA ROUTE ADMIN WAJIB LOGIN + ROLE ADMIN
// ============================================================
router.use(authMiddleware, adminMiddleware);

// ============================================================
// 1. DASHBOARD
// ============================================================
router.get('/dashboard/stats', AdminController.getStats);
router.get('/dashboard/charts', AdminController.getChartData); // tambahan

// ============================================================
// 2. USER MANAGEMENT
// ============================================================
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/reset-password', AdminController.resetPassword);
router.put('/users/:id/activate', AdminController.toggleUserActive);

// ============================================================
// 3. SYMPTOM MANAGEMENT
// ============================================================
router.get('/symptoms', AdminController.getSymptoms);
router.get('/symptoms/:id', AdminController.getSymptomById);
router.post('/symptoms', AdminController.createSymptom);
router.put('/symptoms/:id', AdminController.updateSymptom);
router.delete('/symptoms/:id', AdminController.deleteSymptom);

// ============================================================
// 4. DAMAGE MANAGEMENT
// ============================================================
router.get('/damages', AdminController.getDamages);
router.get('/damages/:id', AdminController.getDamageById);
router.post('/damages', AdminController.createDamage);
router.put('/damages/:id', AdminController.updateDamage);
router.delete('/damages/:id', AdminController.deleteDamage);

// ============================================================
// 5. DAMAGE-SYMPTOM RELATIONSHIP
// ============================================================
router.get('/damage-symptoms/:damage_id', AdminController.getDamageSymptoms);
router.post('/damage-symptoms', AdminController.createDamageSymptom);
router.put('/damage-symptoms/:id', AdminController.updateDamageSymptom);
router.delete('/damage-symptoms/:id', AdminController.deleteDamageSymptom);

// ============================================================
// 6. SOLUTION MANAGEMENT
// ============================================================
router.get('/solutions/:damage_id', AdminController.getSolutions);
router.post('/solutions', AdminController.createSolution);
router.put('/solutions/:id', AdminController.updateSolution);
router.delete('/solutions/:id', AdminController.deleteSolution);

// ============================================================
// 7. RULE MANAGEMENT (knowledge_base)
// ============================================================
router.get('/rules', AdminController.getRules);
router.get('/rules/:id', AdminController.getRuleById);
router.post('/rules', AdminController.createRule);
router.put('/rules/:id', AdminController.updateRule);
router.delete('/rules/:id', AdminController.deleteRule);

// ============================================================
// 8. CONSULTATION MONITORING
// ============================================================
router.get('/consultations', AdminController.getConsultations);
router.get('/consultations/:id', AdminController.getConsultationById);
router.get('/consultations/:id/results', AdminController.getConsultationResults);

// ============================================================
// 9. LOGS & FEEDBACK
// ============================================================
router.get('/logs', AdminController.getLogs);
router.get('/feedback', AdminController.getFeedback);

// ============================================================
// 10. ANALYTICS
// ============================================================
router.get('/analytics/accuracy', AdminController.getAccuracy);
router.get('/analytics/top-damages', AdminController.getTopDamages);

// ============================================================
// 11. NOTIFICATIONS (BROADCAST)
// ============================================================
router.get('/notifications/broadcast', AdminController.getNotifications);
router.post('/notifications/broadcast', AdminController.sendBroadcast);

module.exports = router;