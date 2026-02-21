const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const validate = require('../middleware/validate');

const createPaymentValidation = [
  body('consultationId').optional().isUUID(),
  body('patientId').isUUID().withMessage('Valid patient ID required'),
  body('amount').isFloat({ min: 0 }).withMessage('Valid amount required'),
  validate
];

router.post('/create', authenticate, createPaymentValidation, paymentController.createPayment);
router.post('/verify', authenticate, paymentController.verifyPayment);
router.get('/:id', authenticate, paymentController.getPayment);
router.get('/consultation/:consultationId', authenticate, paymentController.getPaymentByConsultation);

module.exports = router;