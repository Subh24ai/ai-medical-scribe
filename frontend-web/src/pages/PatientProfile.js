import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Phone, Mail, Calendar, FileText, Pill, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PatientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const fetchPatientData = async () => {
    try {
      const [patientRes, consultationsRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/consultations/patient/${id}`)
      ]);
      
      setPatient(patientRes.data.data.patient);
      setConsultations(consultationsRes.data.data.consultations || []);
    } catch (error) {
      toast.error('Failed to load patient data');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Patient not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/patients')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Patients
      </button>

      {/* Patient Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-blue-600" />
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">{patient.name}</h1>
              <p className="text-gray-600 mt-1">Patient ID: {patient.patientId}</p>
              <div className="flex gap-4 mt-3">
                <span className="text-sm text-gray-600">{patient.age} years</span>
                <span className="text-sm text-gray-600">•</span>
                <span className="text-sm text-gray-600">{patient.gender}</span>
                {patient.bloodGroup && (
                  <>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">Blood: {patient.bloodGroup}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => navigate(`/consultation/new?patientId=${patient.id}`)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Start Consultation
          </button>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
          {patient.phone && (
            <div className="flex items-center">
              <Phone className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="text-sm font-medium">{patient.phone}</p>
              </div>
            </div>
          )}
          {patient.email && (
            <div className="flex items-center">
              <Mail className="w-5 h-5 text-gray-400 mr-3" />
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium">{patient.email}</p>
              </div>
            </div>
          )}
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-xs text-gray-500">Registered</p>
              <p className="text-sm font-medium">
                {new Date(patient.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Medical Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Allergies</h2>
          {patient.allergies && patient.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.allergies.map((allergy, index) => (
                <span key={index} className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No known allergies</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Chronic Conditions</h2>
          {patient.chronicConditions && patient.chronicConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {patient.chronicConditions.map((condition, index) => (
                <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No chronic conditions</p>
          )}
        </div>
      </div>

      {/* Consultation History */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Consultation History</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {consultations.length > 0 ? (
            consultations.map((consultation) => (
              <div
                key={consultation.id}
                className="p-6 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/consultation/${consultation.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">
                      {consultation.chiefComplaint || 'General Consultation'}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {consultation.diagnosis || 'No diagnosis recorded'}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Dr. {consultation.doctor?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {new Date(consultation.consultationDate).toLocaleDateString('en-IN')}
                    </p>
                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${
                      consultation.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {consultation.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No consultation history</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;