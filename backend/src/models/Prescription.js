const { DataTypes } = require('sequelize');
const { getDatabase } = require('../database/connection');

const Prescription = getDatabase().define('Prescription', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  consultationId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'consultation_id'
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
  prescriptionNumber: {
    type: DataTypes.STRING(50),
    unique: true,
    field: 'prescription_number'
  },
  prescriptionDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW,
    field: 'prescription_date'
  },
  medicines: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  labTests: {
    type: DataTypes.JSONB,
    defaultValue: [],
    field: 'lab_tests'
  },
  advice: {
    type: DataTypes.TEXT
  },
  followUpInstructions: {
    type: DataTypes.TEXT,
    field: 'follow_up_instructions'
  },
  patientExplanation: {
    type: DataTypes.JSONB,
    defaultValue: {},
    field: 'patient_explanation'
  },
  pdfUrl: {
    type: DataTypes.TEXT,
    field: 'pdf_url'
  },
  status: {
    type: DataTypes.STRING(50),
    defaultValue: 'draft'
  },
  isSentToPatient: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_sent_to_patient'
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
  tableName: 'prescriptions',
  timestamps: true,
  underscored: false
});

module.exports = Prescription;