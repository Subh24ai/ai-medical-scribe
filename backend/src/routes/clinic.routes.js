const express = require('express');
const router = express.Router();
const clinicController = require('../controllers/clinic.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, clinicController.getClinicInfo);
router.put('/settings', authenticate, clinicController.updateClinicSettings);

module.exports = router;