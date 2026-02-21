const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth');

router.get('/dashboard', authenticate, analyticsController.getDashboardStats);
router.get('/revenue', authenticate, analyticsController.getRevenueReport);
router.get('/patients', authenticate, analyticsController.getPatientStats);

module.exports = router;