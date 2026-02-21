const { DataTypes } = require('sequelize');
const { getDatabase } = require('../database/connection');

const Patient = getDatabase().define('Patient', {
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
    type: DataTypes.STRING(50),
    unique: true,
    field: 'patient_id'
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER
  },
  gender: {
    type: DataTypes.STRING(10)
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  email: {
    type: DataTypes.STRING(255),
    validate: {
      isEmail: true
    }
  },
  address: {
    type: DataTypes.TEXT
  },
  bloodGroup: {
    type: DataTypes.STRING(10),
    field: 'blood_group'
  },
  allergies: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: []
  },
  chronicConditions: {
    type: DataTypes.ARRAY(DataTypes.TEXT),
    defaultValue: [],
    field: 'chronic_conditions'
  },
  emergencyContactName: {
    type: DataTypes.STRING(255),
    field: 'emergency_contact_name'
  },
  emergencyContactPhone: {
    type: DataTypes.STRING(20),
    field: 'emergency_contact_phone'
  },
  preferredLanguage: {
    type: DataTypes.STRING(10),
    defaultValue: 'hi',
    field: 'preferred_language'
  },
  insuranceProvider: {
    type: DataTypes.STRING(255),
    field: 'insurance_provider'
  },
  insuranceNumber: {
    type: DataTypes.STRING(100),
    field: 'insurance_number'
  },
  profileImageUrl: {
    type: DataTypes.TEXT,
    field: 'profile_image_url'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
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
  tableName: 'patients',
  timestamps: true,
  underscored: false
});

module.exports = Patient;