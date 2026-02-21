const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescription.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createPrescriptionValidation = [
  body('consultationId').isUUID().withMessage('Valid consultation ID required'),
  body('patientId').isUUID().withMessage('Valid patient ID required'),
  body('medicines').isArray().withMessage('Medicines must be an array'),
  validate
];

router.post('/', authenticate, createPrescriptionValidation, prescriptionController.createPrescription);
router.get('/:id', authenticate, prescriptionController.getPrescription);
router.put('/:id', authenticate, prescriptionController.updatePrescription);
router.post('/:id/finalize', authenticate, prescriptionController.finalizePrescription);
router.post('/:id/send', authenticate, prescriptionController.sendToPatient);
router.get('/patient/:patientId', authenticate, prescriptionController.getPatientPrescriptions);

module.exports = router;