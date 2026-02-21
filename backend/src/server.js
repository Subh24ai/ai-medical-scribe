const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const config = require('./config/config');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { connectDatabase } = require('./database/connection');
const { connectRedis } = require('./config/redis');

// Import routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const consultationRoutes = require('./routes/consultation.routes');
const prescriptionRoutes = require('./routes/prescription.routes');
const paymentRoutes = require('./routes/payment.routes');
const doctorRoutes = require('./routes/doctor.routes');
const clinicRoutes = require('./routes/clinic.routes');
const drugRoutes = require('./routes/drug.routes');
const analyticsRoutes = require('./routes/analytics.routes');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.frontendUrl,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: config.apiVersion
  });
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/consultations', consultationRoutes);
apiRouter.use('/prescriptions', prescriptionRoutes);
apiRouter.use('/payments', paymentRoutes);
apiRouter.use('/doctors', doctorRoutes);
apiRouter.use('/clinics', clinicRoutes);
apiRouter.use('/drugs', drugRoutes);
apiRouter.use('/analytics', analyticsRoutes);

app.use(`/api/${config.apiVersion}`, apiRouter);

// WebSocket for real-time transcription
io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('start-consultation', (data) => {
    logger.info('Consultation started', { consultationId: data.consultationId });
    socket.join(`consultation-${data.consultationId}`);
  });

  socket.on('audio-chunk', async (data) => {
    // Forward to AI service for transcription
    io.to(`consultation-${data.consultationId}`).emit('transcription-update', {
      text: 'Processing...',
      speaker: data.speaker
    });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase();
    logger.info('Database connected successfully');

    // Connect to Redis
    await connectRedis();
    logger.info('Redis connected successfully');

    // Start listening
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`API available at ${config.backendUrl}/api/${config.apiVersion}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Make io available to routes
app.set('io', io);

startServer();

module.exports = { app, io };