const { DataTypes } = require('sequelize');
const { getDatabase } = require('../database/connection');

const Doctor = getDatabase().define('Doctor', {
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
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash'
  },
  phone: {
    type: DataTypes.STRING(20)
  },
  registrationNumber: {
    type: DataTypes.STRING(100),
    unique: true,
    field: 'registration_number'
  },
  specialization: {
    type: DataTypes.STRING(255)
  },
  qualification: {
    type: DataTypes.STRING(255)
  },
  signatureUrl: {
    type: DataTypes.TEXT,
    field: 'signature_url'
  },
  profileImageUrl: {
    type: DataTypes.TEXT,
    field: 'profile_image_url'
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'doctor'
  },
  preferredLanguage: {
    type: DataTypes.STRING(10),
    defaultValue: 'en',
    field: 'preferred_language'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  lastLogin: {
    type: DataTypes.DATE,
    field: 'last_login'
  },
  settings: {
    type: DataTypes.JSONB,
    defaultValue: {}
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
  tableName: 'doctors',
  timestamps: true,
  underscored: false
});

module.exports = Doctor;