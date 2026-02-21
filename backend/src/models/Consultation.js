const { DataTypes } = require('sequelize');
const { getDatabase } = require('../database/connection');

const Consultation = getDatabase().define('Consultation', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  clinicId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'clinic_id'
  },
  patientId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'patient_id'
  },
  doctorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'doctor_id'
  },
  consultationDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'consultation_date'
  },
  chiefComplaint: {
    type: DataTypes.TEXT,
    field: 'chief_complaint'
  },
  historyOfPresentIllness: {
    type: DataTypes.TEXT,
    field: 'history_of_present_illness'
  },
  examinationFindings: {
    type: DataTypes.TEXT,
    field: 'examination_findings'
  },
  diagnosis: {
    type: DataTypes.TEXT
  },
  treatmentPlan: {
    type: DataTypes.TEXT,
    field: 'treatment_plan'
  },
  followUpDate: {
    type: DataTypes.DATEONLY,
    field: 'follow_up_date'
  },
  vitals: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  audioRecordingUrl: {
    type: DataTypes.TEXT,
    field: 'audio_recording_url'
  },
  transcription: {
    type: DataTypes.TEXT
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'in_progress'
  },
  durationMinutes: {
    type: DataTypes.INTEGER,
    field: 'duration_minutes'
  },
  notes: {
    type: DataTypes.TEXT
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'consultations',
  timestamps: true,
  underscored: false
});

module.exports = Consultation;