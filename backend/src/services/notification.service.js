const twilio = require('twilio');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../utils/logger');

// Initialize Twilio
let twilioClient = null;
if (config.twilio.accountSid && config.twilio.authToken) {
  twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
}

// Initialize email transporter
let emailTransporter = null;
if (config.smtp.host) {
  emailTransporter = nodemailer.createTransporter({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password
    }
  });
}

/**
 * Send SMS notification
 */
async function sendSMS(phoneNumber, message) {
  if (!twilioClient) {
    logger.warn('Twilio not configured, skipping SMS');
    return false;
  }

  try {
    // Format phone number for Indian numbers
    const formattedPhone = phoneNumber.startsWith('+91') 
      ? phoneNumber 
      : `+91${phoneNumber}`;

    await twilioClient.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: formattedPhone
    });

    logger.info('SMS sent successfully', { phoneNumber: formattedPhone });
    return true;
  } catch (error) {
    logger.error('Failed to send SMS', { error, phoneNumber });
    return false;
  }
}

/**
 * Send email notification
 */
async function sendEmail({ to, subject, text, html }) {
  if (!emailTransporter) {
    logger.warn('Email not configured, skipping email');
    return false;
  }

  try {
    await emailTransporter.sendMail({
      from: config.smtp.user,
      to,
      subject,
      text,
      html
    });

    logger.info('Email sent successfully', { to, subject });
    return true;
  } catch (error) {
    logger.error('Failed to send email', { error, to });
    return false;
  }
}

/**
 * Send prescription notification to patient
 */
async function sendPrescriptionNotification(patient, prescriptionUrl) {
  const message = `Dear ${patient.name}, your prescription is ready. View it here: ${prescriptionUrl}`;
  
  // Send SMS
  if (patient.phone) {
    await sendSMS(patient.phone, message);
  }

  // Send Email
  if (patient.email) {
    await sendEmail({
      to: patient.email,
      subject: 'Your Prescription is Ready',
      text: message,
      html: `
        <h2>Your Prescription is Ready</h2>
        <p>Dear ${patient.name},</p>
        <p>Your prescription has been prepared and is ready for review.</p>
        <p><a href="${prescriptionUrl}">View Prescription</a></p>
        <p>If you have any questions, please contact your doctor.</p>
      `
    });
  }

  return true;
}

/**
 * Send appointment reminder
 */
async function sendAppointmentReminder(patient, appointment) {
  const appointmentDate = new Date(appointment.appointmentDate);
  const message = `Reminder: You have a doctor appointment on ${appointmentDate.toLocaleDateString()} at ${appointmentDate.toLocaleTimeString()}`;

  if (patient.phone) {
    await sendSMS(patient.phone, message);
  }

  if (patient.email) {
    await sendEmail({
      to: patient.email,
      subject: 'Appointment Reminder',
      text: message,
      html: `
        <h2>Appointment Reminder</h2>
        <p>Dear ${patient.name},</p>
        <p>This is a reminder for your upcoming appointment:</p>
        <ul>
          <li>Date: ${appointmentDate.toLocaleDateString()}</li>
          <li>Time: ${appointmentDate.toLocaleTimeString()}</li>
        </ul>
        <p>Please arrive 10 minutes early.</p>
      `
    });
  }

  return true;
}

/**
 * Send payment receipt
 */
async function sendPaymentReceipt(patient, payment) {
  const message = `Payment of ₹${payment.amount} received successfully. Receipt number: ${payment.receiptNumber}`;

  if (patient.phone) {
    await sendSMS(patient.phone, message);
  }

  if (patient.email) {
    await sendEmail({
      to: patient.email,
      subject: 'Payment Receipt',
      text: message,
      html: `
        <h2>Payment Receipt</h2>
        <p>Dear ${patient.name},</p>
        <p>Thank you for your payment.</p>
        <ul>
          <li>Amount: ₹${payment.amount}</li>
          <li>Receipt Number: ${payment.receiptNumber}</li>
          <li>Payment Method: ${payment.paymentMethod}</li>
          <li>Date: ${new Date(payment.createdAt).toLocaleDateString()}</li>
        </ul>
      `
    });
  }

  return true;
}

module.exports = {
  sendSMS,
  sendEmail,
  sendPrescriptionNotification,
  sendAppointmentReminder,
  sendPaymentReceipt
};