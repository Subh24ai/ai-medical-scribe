const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config/config');
const logger = require('../utils/logger');

const anthropic = new Anthropic({
  apiKey: config.anthropic.apiKey
});

/**
 * Generate medical documentation from consultation transcription
 */
async function generateMedicalDocumentation(transcription) {
  try {
    const prompt = `You are an expert medical AI assistant helping to document a clinical consultation in India. 

Analyze the following doctor-patient consultation transcription and extract structured medical information:

TRANSCRIPTION:
${transcription}

Please provide a structured medical documentation in JSON format with the following fields:
1. chiefComplaint: Main reason for visit (brief, 1-2 sentences)
2. history: History of present illness (detailed narrative)
3. examination: Physical examination findings
4. vitals: Object with BP, pulse, temperature, SpO2, weight if mentioned
5. diagnosis: Primary diagnosis and differential diagnoses
6. treatmentPlan: Recommended treatment approach
7. medicines: Array of medicines with {name, dosage, frequency, duration, instructions}
8. labTests: Array of recommended lab tests
9. advice: General advice and lifestyle recommendations
10. followUp: Follow-up recommendations

Return ONLY valid JSON, no additional text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    const documentation = JSON.parse(jsonMatch[0]);
    
    return documentation;
  } catch (error) {
    logger.error('AI documentation generation error', error);
    throw error;
  }
}

/**
 * Generate patient explanation in their preferred language
 */
async function generatePatientExplanation(prescription, diagnosis, language = 'hi') {
  try {
    const languageNames = {
      'hi': 'Hindi',
      'en': 'English',
      'ta': 'Tamil',
      'te': 'Telugu',
      'bn': 'Bengali',
      'mr': 'Marathi',
      'gu': 'Gujarati',
      'kn': 'Kannada',
      'ml': 'Malayalam'
    };

    const targetLanguage = languageNames[language] || 'Hindi';

    const prompt = `You are a medical AI assistant. Explain the following diagnosis and treatment to a patient in simple ${targetLanguage} language:

DIAGNOSIS: ${diagnosis}

MEDICINES:
${JSON.stringify(prescription.medicines, null, 2)}

Provide a clear, compassionate explanation in ${targetLanguage} that includes:
1. What the condition is (in simple terms)
2. Why each medicine is prescribed
3. How to take each medicine
4. Important precautions
5. When to seek immediate medical help

Keep the language simple and reassuring. Return as JSON with fields: explanation, medicineInstructions (array), precautions (array), emergencyWarning`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Patient explanation generation error', error);
    throw error;
  }
}

/**
 * Check for drug interactions
 */
async function checkDrugInteractions(medicines, patientAllergies = [], chronicConditions = []) {
  try {
    const medicineList = medicines.map(m => m.name).join(', ');
    
    const prompt = `You are a clinical pharmacology AI assistant. Analyze potential drug interactions and contraindications:

MEDICINES PRESCRIBED: ${medicineList}

PATIENT ALLERGIES: ${patientAllergies.join(', ') || 'None'}

CHRONIC CONDITIONS: ${chronicConditions.join(', ') || 'None'}

Analyze and provide:
1. Any dangerous drug-drug interactions
2. Contraindications based on patient allergies
3. Concerns based on chronic conditions
4. Recommendations

Return as JSON with fields: interactions (array), contraindications (array), concerns (array), recommendations (array), overallRisk (low/medium/high)`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Drug interaction check error', error);
    throw error;
  }
}

/**
 * Clinical decision support - suggest diagnosis based on symptoms
 */
async function suggestDiagnosis(symptoms, vitals, patientAge, patientGender) {
  try {
    const prompt = `You are a clinical decision support AI. Based on the following information, suggest possible diagnoses:

SYMPTOMS: ${symptoms}
VITALS: ${JSON.stringify(vitals)}
PATIENT AGE: ${patientAge}
PATIENT GENDER: ${patientGender}

Provide differential diagnoses ranked by likelihood. Return as JSON with fields:
- primaryDiagnosis: Most likely diagnosis
- differentialDiagnoses: Array of other possibilities with likelihood
- recommendedTests: Array of suggested diagnostic tests
- redFlags: Array of warning signs that need immediate attention
- notes: Additional clinical considerations`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from AI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    logger.error('Clinical decision support error', error);
    throw error;
  }
}

/**
 * Transcribe audio to text (using Whisper via external Python service)
 */
async function transcribeAudio(audioBuffer, language = 'hi') {
  try {
    // This would call your Python service running Whisper
    // For now, returning a placeholder
    const axios = require('axios');
    
    const formData = new FormData();
    formData.append('audio', audioBuffer);
    formData.append('language', language);

    const response = await axios.post(
      `${config.aiService.url}/transcribe`,
      formData,
      {
        headers: formData.getHeaders()
      }
    );

    return response.data.transcription;
  } catch (error) {
    logger.error('Audio transcription error', error);
    throw error;
  }
}

module.exports = {
  generateMedicalDocumentation,
  generatePatientExplanation,
  checkDrugInteractions,
  suggestDiagnosis,
  transcribeAudio
};