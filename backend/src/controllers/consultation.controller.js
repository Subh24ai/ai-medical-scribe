const Consultation = require('../models/Consultation');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const { generateMedicalDocumentation } = require('../services/ai.service');
const logger = require('../utils/logger');

class ConsultationController {
  async createConsultation(req, res, next) {
    try {
      const { patientId } = req.body;
      const doctorId = req.user.id;
      const clinicId = req.user.clinicId;

      // Verify patient exists
      const patient = await Patient.findByPk(patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Create consultation
      const consultation = await Consultation.create({
        patientId,
        doctorId,
        clinicId,
        status: 'in_progress'
      });

      // Get socket.io instance
      const io = req.app.get('io');
      io.to(`doctor-${doctorId}`).emit('consultation-started', {
        consultationId: consultation.id,
        patientName: patient.name
      });

      res.status(201).json({
        success: true,
        message: 'Consultation started',
        data: { consultation }
      });
    } catch (error) {
      logger.error('Create consultation error', error);
      next(error);
    }
  }

  async processTranscription(req, res, next) {
    try {
      const { id } = req.params;
      const { transcription, audioUrl } = req.body;

      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      // Update consultation with transcription
      await consultation.update({
        transcription,
        audioRecordingUrl: audioUrl
      });

      // Process with AI to extract medical information
      const aiResult = await generateMedicalDocumentation(transcription);

      // Update consultation with AI-extracted data
      await consultation.update({
        chiefComplaint: aiResult.chiefComplaint,
        historyOfPresentIllness: aiResult.history,
        examinationFindings: aiResult.examination,
        diagnosis: aiResult.diagnosis,
        treatmentPlan: aiResult.treatmentPlan,
        vitals: aiResult.vitals
      });

      res.json({
        success: true,
        message: 'Transcription processed successfully',
        data: {
          consultation,
          aiSuggestions: aiResult
        }
      });
    } catch (error) {
      logger.error('Process transcription error', error);
      next(error);
    }
  }

  async getConsultation(req, res, next) {
    try {
      const { id } = req.params;

      const consultation = await Consultation.findByPk(id, {
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'name', 'age', 'gender', 'phone']
          },
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'name', 'specialization']
          }
        ]
      });

      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      res.json({
        success: true,
        data: { consultation }
      });
    } catch (error) {
      logger.error('Get consultation error', error);
      next(error);
    }
  }

  async updateConsultation(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      await consultation.update(updateData);

      res.json({
        success: true,
        message: 'Consultation updated successfully',
        data: { consultation }
      });
    } catch (error) {
      logger.error('Update consultation error', error);
      next(error);
    }
  }

  async completeConsultation(req, res, next) {
    try {
      const { id } = req.params;

      const consultation = await Consultation.findByPk(id);
      if (!consultation) {
        return res.status(404).json({
          success: false,
          message: 'Consultation not found'
        });
      }

      await consultation.update({
        status: 'completed',
        durationMinutes: Math.floor(
          (new Date() - new Date(consultation.consultationDate)) / 60000
        )
      });

      res.json({
        success: true,
        message: 'Consultation completed',
        data: { consultation }
      });
    } catch (error) {
      logger.error('Complete consultation error', error);
      next(error);
    }
  }

  async getConsultationHistory(req, res, next) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (page - 1) * limit;

      const { count, rows: consultations } = await Consultation.findAndCountAll({
        where: { patientId },
        include: [
          {
            model: Doctor,
            as: 'doctor',
            attributes: ['id', 'name', 'specialization']
          }
        ],
        order: [['consultationDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          consultations,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      logger.error('Get consultation history error', error);
      next(error);
    }
  }

  async getTodayConsultations(req, res, next) {
    try {
      const doctorId = req.user.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const consultations = await Consultation.findAll({
        where: {
          doctorId,
          consultationDate: {
            [Op.gte]: today
          }
        },
        include: [
          {
            model: Patient,
            as: 'patient',
            attributes: ['id', 'name', 'age', 'gender', 'phone']
          }
        ],
        order: [['consultationDate', 'DESC']]
      });

      res.json({
        success: true,
        data: { consultations }
      });
    } catch (error) {
      logger.error('Get today consultations error', error);
      next(error);
    }
  }
}

module.exports = new ConsultationController();