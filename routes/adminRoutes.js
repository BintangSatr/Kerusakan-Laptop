// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// ============================================================
// SEMUA ROUTE ADMIN WAJIB LOGIN + ROLE ADMIN
// ============================================================
router.use(authMiddleware, adminMiddleware);

// Dashboard
router.get('/dashboard/stats', AdminController.getStats);

// User Management
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.post('/users', AdminController.createUser);
router.put('/users/:id', AdminController.updateUser);
router.delete('/users/:id', AdminController.deleteUser);
router.put('/users/:id/reset-password', AdminController.resetPassword);
router.put('/users/:id/activate', AdminController.toggleUserActive);

// Symptom Management
router.get('/symptoms', AdminController.getSymptoms);
router.get('/symptoms/:id', AdminController.getSymptomById);
router.post('/symptoms', AdminController.createSymptom);
router.put('/symptoms/:id', AdminController.updateSymptom);
router.delete('/symptoms/:id', AdminController.deleteSymptom);

// Damage Management
router.get('/damages', AdminController.getDamages);
router.get('/damages/:id', AdminController.getDamageById);
router.post('/damages', AdminController.createDamage);
router.put('/damages/:id', AdminController.updateDamage);
router.delete('/damages/:id', AdminController.deleteDamage);

// Damage-Symptom Relationship
router.get('/damage-symptoms/:damage_id', AdminController.getDamageSymptoms);
router.post('/damage-symptoms', AdminController.createDamageSymptom);
router.put('/damage-symptoms/:id', AdminController.updateDamageSymptom);
router.delete('/damage-symptoms/:id', AdminController.deleteDamageSymptom);

// Solution Management
router.get('/solutions/:damage_id', AdminController.getSolutions);
router.post('/solutions', AdminController.createSolution);
router.put('/solutions/:id', AdminController.updateSolution);
router.delete('/solutions/:id', AdminController.deleteSolution);

// Rule Management (knowledge_base)
router.get('/rules', AdminController.getRules);
router.get('/rules/:id', AdminController.getRuleById);
router.post('/rules', AdminController.createRule);
router.put('/rules/:id', AdminController.updateRule);
router.delete('/rules/:id', AdminController.deleteRule);

// Consultation Monitoring
router.get('/consultations', AdminController.getConsultations);
router.get('/consultations/:id', AdminController.getConsultationById);
router.get('/consultations/:id/results', AdminController.getConsultationResults);

module.exports = router;