const express = require('express');
const router = express.Router();
const consultationController = require('../controllers/consultation.controller');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, consultationController.createConsultation);
router.get('/', authenticate, consultationController.getTodayConsultations);
router.get('/:id', authenticate, consultationController.getConsultation);
router.put('/:id', authenticate, consultationController.updateConsultation);
router.post('/:id/process-transcription', authenticate, consultationController.processTranscription);
router.post('/:id/complete', authenticate, consultationController.completeConsultation);
router.get('/patient/:patientId', authenticate, consultationController.getConsultationHistory);

module.exports = router;