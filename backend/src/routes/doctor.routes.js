const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, doctorController.getDoctors);
router.get('/:id', authenticate, doctorController.getDoctorById);
router.put('/:id', authenticate, doctorController.updateDoctor);
router.get('/:id/schedule', authenticate, doctorController.getSchedule);

module.exports = router;