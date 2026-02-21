import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, Save, Send, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import RecordRTC from 'recordrtc';
import io from 'socket.io-client';
import api, { endpoints } from '../services/api';

const Consultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [formData, setFormData] = useState({
    chiefComplaint: '',
    diagnosis: '',
    vitals: {
      bp: '',
      pulse: '',
      temperature: '',
      spo2: '',
      weight: ''
    },
    medicines: [],
    labTests: [],
    advice: ''
  });
  
  const recorderRef = useRef(null);
  const socketRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    fetchConsultation();
    initializeSocket();
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  const fetchConsultation = async () => {
    try {
      const response = await api.get(endpoints.consultationById(id));
      const data = response.data.data.consultation;
      setConsultation(data);
      setPatient(data.patient);
      
      // Pre-fill form with existing data
      if (data.chiefComplaint) {
        setFormData(prev => ({
          ...prev,
          chiefComplaint: data.chiefComplaint,
          diagnosis: data.diagnosis || '',
          vitals: data.vitals || prev.vitals
        }));
      }
    } catch (error) {
      toast.error('Failed to load consultation');
    }
  };

  const initializeSocket = () => {
    const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');
    socketRef.current = socket;
    
    socket.on('connect', () => {
      socket.emit('start-consultation', { consultationId: id });
    });
    
    socket.on('transcription-update', (data) => {
      setTranscription(prev => prev + ' ' + data.text);
    });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new RecordRTC(stream, {
        type: 'audio',
        mimeType: 'audio/webm',
        sampleRate: 44100,
        desiredSampRate: 16000,
        recorderType: RecordRTC.StereoAudioRecorder,
        numberOfAudioChannels: 1,
        timeSlice: 3000, // Send chunks every 3 seconds
        ondataavailable: async (blob) => {
          audioChunksRef.current.push(blob);
          
          // Send to backend for real-time transcription
          const formData = new FormData();
          formData.append('audio_chunk', blob);
          formData.append('language', patient?.preferredLanguage || 'hi');
          
          try {
            const response = await fetch('http://localhost:8000/transcribe-stream', {
              method: 'POST',
              body: formData
            });
            
            const data = await response.json();
            if (data.success) {
              setTranscription(prev => prev + ' ' + data.text);
            }
          } catch (error) {
            console.error('Transcription error:', error);
          }
        }
      });
      
      recorder.startRecording();
      recorderRef.current = recorder;
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording. Please check microphone permissions.');
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stopRecording(async () => {
        const blob = recorderRef.current.getBlob();
        
        // Send full audio for final transcription
        await processFullAudio(blob);
        
        // Stop all tracks
        const stream = recorderRef.current.stream;
        stream.getTracks().forEach(track => track.stop());
        
        recorderRef.current = null;
        setIsRecording(false);
        toast.success('Recording stopped');
      });
    }
  };

  const processFullAudio = async (audioBlob) => {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'consultation.webm');
    formData.append('language', patient?.preferredLanguage || 'hi');
    
    try {
      // Transcribe full audio
      const transcribeResponse = await fetch('http://localhost:8000/transcribe', {
        method: 'POST',
        body: formData
      });
      
      const transcribeData = await transcribeResponse.json();
      
      if (transcribeData.success) {
        setTranscription(transcribeData.transcription);
        
        // Process with AI to extract medical information
        const aiResponse = await api.post(
          `/consultations/${id}/process-transcription`,
          {
            transcription: transcribeData.transcription,
            audioUrl: 'uploaded-audio-url' // In production, upload to S3 first
          }
        );
        
        if (aiResponse.data.success) {
          const suggestions = aiResponse.data.data.aiSuggestions;
          setAiSuggestions(suggestions);
          
          // Auto-fill form with AI suggestions
          setFormData(prev => ({
            ...prev,
            chiefComplaint: suggestions.chiefComplaint || prev.chiefComplaint,
            diagnosis: suggestions.diagnosis || prev.diagnosis,
            vitals: { ...prev.vitals, ...suggestions.vitals },
            medicines: suggestions.medicines || []
          }));
          
          toast.success('AI analysis complete!');
        }
      }
    } catch (error) {
      toast.error('Failed to process audio');
      console.error(error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVitalsChange = (vital, value) => {
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [vital]: value
      }
    }));
  };

  const addMedicine = () => {
    setFormData(prev => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        { name: '', dosage: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const updateMedicine = (index, field, value) => {
    setFormData(prev => {
      const newMedicines = [...prev.medicines];
      newMedicines[index] = {
        ...newMedicines[index],
        [field]: value
      };
      return { ...prev, medicines: newMedicines };
    });
  };

  const removeMedicine = (index) => {
    setFormData(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const saveConsultation = async () => {
    try {
      await api.put(endpoints.consultationById(id), formData);
      toast.success('Consultation saved');
    } catch (error) {
      toast.error('Failed to save consultation');
    }
  };

  const generatePrescription = async () => {
    try {
      // First save consultation
      await saveConsultation();
      
      // Create prescription
      const response = await api.post(endpoints.prescriptions, {
        consultationId: id,
        patientId: patient.id,
        ...formData
      });
      
      const prescriptionId = response.data.data.prescription.id;
      
      // Navigate to prescription review
      navigate(`/prescription/${prescriptionId}/review`);
      toast.success('Prescription generated!');
    } catch (error) {
      toast.error('Failed to generate prescription');
    }
  };

  if (!consultation || !patient) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Consultation</h1>
            <p className="text-gray-600 mt-1">
              Patient: {patient.name} | Age: {patient.age} | Gender: {patient.gender}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {isRecording ? (
                <>
                  <MicOff className="w-5 h-5" />
                  Stop Recording
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  Start Recording
                </>
              )}
            </button>
            
            <button
              onClick={saveConsultation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              <Save className="w-5 h-5" />
              Save
            </button>
            
            <button
              onClick={generatePrescription}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <FileText className="w-5 h-5" />
              Generate Prescription
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chief Complaint */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Chief Complaint</h2>
            <textarea
              value={formData.chiefComplaint}
              onChange={(e) => handleInputChange('chiefComplaint', e.target.value)}
              className="w-full border rounded-lg p-3 h-24"
              placeholder="Main reason for visit..."
            />
          </div>

          {/* Vitals */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Vitals</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="BP (e.g., 120/80)"
                value={formData.vitals.bp}
                onChange={(e) => handleVitalsChange('bp', e.target.value)}
                className="border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Pulse (bpm)"
                value={formData.vitals.pulse}
                onChange={(e) => handleVitalsChange('pulse', e.target.value)}
                className="border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Temp (°F)"
                value={formData.vitals.temperature}
                onChange={(e) => handleVitalsChange('temperature', e.target.value)}
                className="border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="SpO2 (%)"
                value={formData.vitals.spo2}
                onChange={(e) => handleVitalsChange('spo2', e.target.value)}
                className="border rounded-lg p-2"
              />
              <input
                type="text"
                placeholder="Weight (kg)"
                value={formData.vitals.weight}
                onChange={(e) => handleVitalsChange('weight', e.target.value)}
                className="border rounded-lg p-2"
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Diagnosis</h2>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              className="w-full border rounded-lg p-3 h-24"
              placeholder="Diagnosis and assessment..."
            />
          </div>

          {/* Medicines */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Medicines</h2>
              <button
                onClick={addMedicine}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                + Add Medicine
              </button>
            </div>
            
            <div className="space-y-4">
              {formData.medicines.map((medicine, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={medicine.name}
                      onChange={(e) => updateMedicine(index, 'name', e.target.value)}
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g., 500mg)"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicine(index, 'dosage', e.target.value)}
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Frequency (e.g., 2x daily)"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicine(index, 'frequency', e.target.value)}
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g., 5 days)"
                      value={medicine.duration}
                      onChange={(e) => updateMedicine(index, 'duration', e.target.value)}
                      className="border rounded p-2"
                    />
                    <input
                      type="text"
                      placeholder="Instructions (e.g., after meals)"
                      value={medicine.instructions}
                      onChange={(e) => updateMedicine(index, 'instructions', e.target.value)}
                      className="border rounded p-2 col-span-2"
                    />
                  </div>
                  <button
                    onClick={() => removeMedicine(index)}
                    className="mt-2 text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Advice & Instructions</h2>
            <textarea
              value={formData.advice}
              onChange={(e) => handleInputChange('advice', e.target.value)}
              className="w-full border rounded-lg p-3 h-32"
              placeholder="General advice, lifestyle recommendations..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Live Transcription */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Live Transcription</h2>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto">
              {transcription || 'Start recording to see transcription...'}
            </div>
            {isRecording && (
              <div className="mt-3 flex items-center text-red-600">
                <span className="animate-pulse mr-2">●</span>
                Recording in progress...
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {aiSuggestions && (
            <div className="bg-blue-50 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4 text-blue-900">AI Suggestions</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Diagnosis:</span>
                  <p className="text-gray-700">{aiSuggestions.diagnosis}</p>
                </div>
                {aiSuggestions.recommendedTests && (
                  <div>
                    <span className="font-medium">Recommended Tests:</span>
                    <ul className="list-disc list-inside text-gray-700">
                      {aiSuggestions.recommendedTests.map((test, i) => (
                        <li key={i}>{test}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Patient Info</h2>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Allergies:</span> {patient.allergies?.join(', ') || 'None'}</div>
              <div><span className="font-medium">Chronic Conditions:</span> {patient.chronicConditions?.join(', ') || 'None'}</div>
              <div><span className="font-medium">Blood Group:</span> {patient.bloodGroup || 'Not specified'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;