const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Consultation = require('../models/Consultation');
const { generatePatientExplanation } = require('./ai.service');
const { sendSMS } = require('./notification.service');
const logger = require('../utils/logger');
const config = require('../config/config');

class PrescriptionService {
  async createPrescription(data) {
    try {
      const { consultationId, patientId, doctorId, medicines, labTests, advice } = data;

      // Generate prescription number
      const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Create prescription
      const prescription = await Prescription.create({
        consultationId,
        patientId,
        doctorId,
        prescriptionNumber,
        medicines,
        labTests: labTests || [],
        advice,
        status: 'draft'
      });

      return prescription;
    } catch (error) {
      logger.error('Create prescription error', error);
      throw error;
    }
  }

  async generatePrescriptionPDF(prescriptionId) {
    try {
      // Fetch prescription with related data
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: [
          {
            model: Patient,
            as: 'patient'
          },
          {
            model: Doctor,
            as: 'doctor',
            include: ['clinic']
          },
          {
            model: Consultation,
            as: 'consultation'
          }
        ]
      });

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Create PDF
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `prescription-${prescription.prescriptionNumber}.pdf`;
      const filePath = path.join(config.storage.localPath, 'prescriptions', fileName);

      // Ensure directory exists
      fs.mkdirSync(path.dirname(filePath), { recursive: true });

      // Pipe PDF to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add clinic letterhead
      doc.fontSize(20).font('Helvetica-Bold').text(prescription.doctor.clinic.name, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(prescription.doctor.clinic.address, { align: 'center' });
      doc.text(`Phone: ${prescription.doctor.clinic.phone} | Email: ${prescription.doctor.clinic.email}`, { align: 'center' });
      doc.moveDown();

      // Add line
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Doctor information
      doc.fontSize(12).font('Helvetica-Bold').text(`Dr. ${prescription.doctor.name}`);
      doc.fontSize(10).font('Helvetica').text(prescription.doctor.specialization);
      doc.text(`Registration No: ${prescription.doctor.registrationNumber}`);
      doc.moveDown();

      // Patient information
      doc.fontSize(12).font('Helvetica-Bold').text('PATIENT DETAILS');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${prescription.patient.name}`);
      doc.text(`Age/Gender: ${prescription.patient.age} years / ${prescription.patient.gender}`);
      doc.text(`Phone: ${prescription.patient.phone}`);
      doc.text(`Date: ${new Date(prescription.prescriptionDate).toLocaleDateString('en-IN')}`);
      doc.text(`Prescription No: ${prescription.prescriptionNumber}`);
      doc.moveDown();

      // Diagnosis
      if (prescription.consultation && prescription.consultation.diagnosis) {
        doc.fontSize(12).font('Helvetica-Bold').text('DIAGNOSIS');
        doc.fontSize(10).font('Helvetica').text(prescription.consultation.diagnosis);
        doc.moveDown();
      }

      // Prescription symbol
      doc.fontSize(20).font('Helvetica-Bold').text('℞', { continued: false });
      doc.moveDown(0.5);

      // Medicines
      doc.fontSize(12).font('Helvetica-Bold').text('MEDICINES');
      doc.moveDown(0.5);

      prescription.medicines.forEach((medicine, index) => {
        doc.fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${medicine.name}`);
        doc.font('Helvetica').text(`   Dosage: ${medicine.dosage}`);
        doc.text(`   Frequency: ${medicine.frequency}`);
        doc.text(`   Duration: ${medicine.duration}`);
        if (medicine.instructions) {
          doc.text(`   Instructions: ${medicine.instructions}`);
        }
        doc.moveDown(0.5);
      });

      // Lab tests
      if (prescription.labTests && prescription.labTests.length > 0) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('INVESTIGATIONS');
        doc.moveDown(0.5);
        prescription.labTests.forEach((test, index) => {
          doc.fontSize(10).font('Helvetica').text(`${index + 1}. ${test}`);
        });
        doc.moveDown();
      }

      // Advice
      if (prescription.advice) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('ADVICE');
        doc.fontSize(10).font('Helvetica').text(prescription.advice);
        doc.moveDown();
      }

      // Follow-up
      if (prescription.followUpInstructions) {
        doc.moveDown();
        doc.fontSize(12).font('Helvetica-Bold').text('FOLLOW-UP');
        doc.fontSize(10).font('Helvetica').text(prescription.followUpInstructions);
        doc.moveDown();
      }

      // Doctor signature
      doc.moveDown(2);
      if (prescription.doctor.signatureUrl) {
        // Add signature image if available
        // doc.image(prescription.doctor.signatureUrl, { width: 100 });
      }
      doc.fontSize(10).font('Helvetica-Bold').text(`Dr. ${prescription.doctor.name}`, { align: 'right' });
      doc.font('Helvetica').text(prescription.doctor.specialization, { align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica-Oblique').text(
        'This is a digitally generated prescription. Please follow the instructions carefully.',
        50,
        doc.page.height - 50,
        { align: 'center' }
      );

      // Finalize PDF
      doc.end();

      // Wait for PDF to be written
      await new Promise((resolve, reject) => {
        stream.on('finish', resolve);
        stream.on('error', reject);
      });

      // Update prescription with PDF URL
      const pdfUrl = `/uploads/prescriptions/${fileName}`;
      await prescription.update({ pdfUrl });

      return { pdfUrl, filePath };
    } catch (error) {
      logger.error('Generate prescription PDF error', error);
      throw error;
    }
  }

  async finalizePrescription(prescriptionId, patientLanguage = 'hi') {
    try {
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: [
          {
            model: Patient,
            as: 'patient'
          },
          {
            model: Consultation,
            as: 'consultation'
          }
        ]
      });

      if (!prescription) {
        throw new Error('Prescription not found');
      }

      // Generate patient explanation in their language
      const patientExplanation = await generatePatientExplanation(
        prescription,
        prescription.consultation.diagnosis,
        patientLanguage
      );

      // Generate PDF
      const { pdfUrl } = await this.generatePrescriptionPDF(prescriptionId);

      // Update prescription status
      await prescription.update({
        status: 'finalized',
        patientExplanation,
        pdfUrl
      });

      // Send SMS to patient
      await this.sendPrescriptionToPatient(prescriptionId);

      return prescription;
    } catch (error) {
      logger.error('Finalize prescription error', error);
      throw error;
    }
  }

  async sendPrescriptionToPatient(prescriptionId) {
    try {
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: [
          {
            model: Patient,
            as: 'patient'
          }
        ]
      });

      if (!prescription || !prescription.patient.phone) {
        throw new Error('Cannot send prescription - patient phone not available');
      }

      const message = `Dear ${prescription.patient.name}, your prescription is ready. View it here: ${config.frontendUrl}/prescription/${prescription.id}`;

      await sendSMS(prescription.patient.phone, message);

      await prescription.update({ isSentToPatient: true });

      return true;
    } catch (error) {
      logger.error('Send prescription to patient error', error);
      throw error;
    }
  }

  async getPrescription(prescriptionId) {
    try {
      const prescription = await Prescription.findByPk(prescriptionId, {
        include: [
          {
            model: Patient,
            as: 'patient'
          },
          {
            model: Doctor,
            as: 'doctor'
          },
          {
            model: Consultation,
            as: 'consultation'
          }
        ]
      });

      return prescription;
    } catch (error) {
      logger.error('Get prescription error', error);
      throw error;
    }
  }
}

module.exports = new PrescriptionService();