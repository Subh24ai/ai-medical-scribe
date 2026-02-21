import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileText, Download, Send, Printer } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const PrescriptionView = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPrescription();
  }, [id]);

  const fetchPrescription = async () => {
    try {
      const response = await api.get(`/prescriptions/${id}`);
      setPrescription(response.data.data.prescription);
    } catch (error) {
      toast.error('Failed to load prescription');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (prescription?.pdfUrl) {
      window.open(prescription.pdfUrl, '_blank');
    }
  };

  const handleSend = async () => {
    try {
      await api.post(`/prescriptions/${id}/send`);
      toast.success('Prescription sent to patient');
    } catch (error) {
      toast.error('Failed to send prescription');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!prescription) {
    return <div className="p-6">Prescription not found</div>;
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Prescription</h1>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-5 h-5" />
              Download
            </button>
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send className="w-5 h-5" />
              Send to Patient
            </button>
          </div>
        </div>

        {/* Prescription Details */}
        <div className="bg-white rounded-lg shadow p-8">
          {/* Patient Info */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-2">Patient Information</h2>
            <p className="text-gray-700">{prescription.patient?.name}</p>
            <p className="text-sm text-gray-600">
              {prescription.patient?.age} years • {prescription.patient?.gender}
            </p>
          </div>

          {/* Medicines */}
          <div className="mb-6">
            <h2 className="font-semibold text-gray-900 mb-4">℞ Medicines</h2>
            <div className="space-y-4">
              {prescription.medicines?.map((medicine, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900">{index + 1}. {medicine.name}</p>
                  <p className="text-sm text-gray-600">Dosage: {medicine.dosage}</p>
                  <p className="text-sm text-gray-600">Frequency: {medicine.frequency}</p>
                  <p className="text-sm text-gray-600">Duration: {medicine.duration}</p>
                  {medicine.instructions && (
                    <p className="text-sm text-gray-600">Instructions: {medicine.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Lab Tests */}
          {prescription.labTests && prescription.labTests.length > 0 && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Investigations</h2>
              <ul className="list-disc list-inside">
                {prescription.labTests.map((test, index) => (
                  <li key={index} className="text-gray-700">{test}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Advice */}
          {prescription.advice && (
            <div className="mb-6">
              <h2 className="font-semibold text-gray-900 mb-2">Advice</h2>
              <p className="text-gray-700">{prescription.advice}</p>
            </div>
          )}

          {/* Doctor Signature */}
          <div className="mt-8 pt-6 border-t">
            <p className="font-medium text-gray-900">Dr. {prescription.doctor?.name}</p>
            <p className="text-sm text-gray-600">{prescription.doctor?.specialization}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionView;