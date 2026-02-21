const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const config = require('../config/config');
const logger = require('../utils/logger');
const { createAuditLog } = require('../services/auditLog.service');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, phone, registrationNumber, specialization, clinicId } = req.body;

      // Check if doctor already exists
      const existingDoctor = await Doctor.findOne({ where: { email } });
      if (existingDoctor) {
        return res.status(400).json({
          success: false,
          message: 'Doctor with this email already exists'
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create doctor
      const doctor = await Doctor.create({
        name,
        email,
        passwordHash,
        phone,
        registrationNumber,
        specialization,
        clinicId
      });

      // Generate token
      const token = jwt.sign(
        { id: doctor.id, email: doctor.email, role: doctor.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      await createAuditLog({
        userId: doctor.id,
        userType: 'doctor',
        action: 'register',
        entityType: 'doctor',
        entityId: doctor.id,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: 'Doctor registered successfully',
        data: {
          token,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            email: doctor.email,
            role: doctor.role
          }
        }
      });
    } catch (error) {
      logger.error('Registration error', error);
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find doctor
      const doctor = await Doctor.findOne({ where: { email } });
      if (!doctor) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if active
      if (!doctor.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, doctor.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = jwt.sign(
        { id: doctor.id, email: doctor.email, role: doctor.role },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      // Update last login
      await doctor.update({ lastLogin: new Date() });

      await createAuditLog({
        userId: doctor.id,
        userType: 'doctor',
        action: 'login',
        entityType: 'doctor',
        entityId: doctor.id,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          doctor: {
            id: doctor.id,
            name: doctor.name,
            email: doctor.email,
            role: doctor.role,
            clinicId: doctor.clinicId,
            preferredLanguage: doctor.preferredLanguage
          }
        }
      });
    } catch (error) {
      logger.error('Login error', error);
      next(error);
    }
  }

  async getProfile(req, res, next) {
    try {
      const doctor = await Doctor.findByPk(req.user.id, {
        attributes: { exclude: ['passwordHash'] }
      });

      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      res.json({
        success: true,
        data: { doctor }
      });
    } catch (error) {
      logger.error('Get profile error', error);
      next(error);
    }
  }

  async updateProfile(req, res, next) {
    try {
      const { name, phone, specialization, qualification, preferredLanguage } = req.body;

      const doctor = await Doctor.findByPk(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      await doctor.update({
        name: name || doctor.name,
        phone: phone || doctor.phone,
        specialization: specialization || doctor.specialization,
        qualification: qualification || doctor.qualification,
        preferredLanguage: preferredLanguage || doctor.preferredLanguage
      });

      await createAuditLog({
        userId: req.user.id,
        userType: 'doctor',
        action: 'update_profile',
        entityType: 'doctor',
        entityId: doctor.id,
        changes: { name, phone, specialization, qualification, preferredLanguage },
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { doctor }
      });
    } catch (error) {
      logger.error('Update profile error', error);
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const doctor = await Doctor.findByPk(req.user.id);
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, doctor.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);
      await doctor.update({ passwordHash });

      await createAuditLog({
        userId: req.user.id,
        userType: 'doctor',
        action: 'change_password',
        entityType: 'doctor',
        entityId: doctor.id,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error', error);
      next(error);
    }
  }
}

module.exports = new AuthController();