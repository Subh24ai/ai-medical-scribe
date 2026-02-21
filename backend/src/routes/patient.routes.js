const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

// Validation
const createPatientValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('age').optional().isInt().withMessage('Age must be a number'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']),
  body('phone').notEmpty().withMessage('Phone is required'),
  validate
];

// Routes
router.post('/', authenticate, createPatientValidation, patientController.createPatient);
router.get('/', authenticate, patientController.getPatients);
router.get('/search', authenticate, patientController.searchPatients);
router.get('/:id', authenticate, patientController.getPatientById);
router.put('/:id', authenticate, patientController.updatePatient);
router.delete('/:id', authenticate, patientController.deletePatient);

module.exports = router;