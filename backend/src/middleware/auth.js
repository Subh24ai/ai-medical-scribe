const jwt = require('jsonwebtoken');
const config = require('../config/config');
const Doctor = require('../models/Doctor');
const logger = require('../utils/logger');

async function authenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch doctor from database
    const doctor = await Doctor.findByPk(decoded.id);

    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    if (!doctor.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request
    req.user = {
      id: doctor.id,
      email: doctor.email,
      role: doctor.role,
      clinicId: doctor.clinicId
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication token expired'
      });
    }

    logger.error('Authentication error', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
}

module.exports = { authenticate, authorize };