"""
AI Services for Medical Scribe
Handles speech-to-text transcription using Whisper
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import numpy as np
import io
import logging
from werkzeug.utils import secure_filename
import os
import tempfile

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load Whisper model
# Options: tiny, base, small, medium, large
MODEL_SIZE = os.getenv('WHISPER_MODEL_SIZE', 'base')
logger.info(f'Loading Whisper model: {MODEL_SIZE}')
model = whisper.load_model(MODEL_SIZE)
logger.info('Whisper model loaded successfully')

# Supported languages for Indian context
SUPPORTED_LANGUAGES = {
    'en': 'english',
    'hi': 'hindi',
    'ta': 'tamil',
    'te': 'telugu',
    'bn': 'bengali',
    'mr': 'marathi',
    'gu': 'gujarati',
    'kn': 'kannada',
    'ml': 'malayalam'
}

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model': MODEL_SIZE,
        'supported_languages': list(SUPPORTED_LANGUAGES.keys())
    })

@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    """
    Transcribe audio file to text
    Supports: Hindi/English code-mixing
    """
    try:
        # Check if audio file is present
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'hi')  # Default to Hindi
        
        if audio_file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_audio_path = temp_audio.name
        
        try:
            # Transcribe using Whisper
            logger.info(f'Transcribing audio in language: {language}')
            
            # For Hindi-English mix, we use 'hi' as base but Whisper handles code-mixing well
            result = model.transcribe(
                temp_audio_path,
                language=language if language in SUPPORTED_LANGUAGES else None,
                task='transcribe',
                fp16=False  # Set to True if using GPU
            )
            
            transcription = result['text']
            
            # Extract segments with timestamps
            segments = []
            for segment in result.get('segments', []):
                segments.append({
                    'start': segment['start'],
                    'end': segment['end'],
                    'text': segment['text']
                })
            
            logger.info(f'Transcription completed: {len(transcription)} characters')
            
            return jsonify({
                'success': True,
                'transcription': transcription,
                'segments': segments,
                'language': result.get('language', language)
            })
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
    
    except Exception as e:
        logger.error(f'Transcription error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/transcribe-stream', methods=['POST'])
def transcribe_audio_stream():
    """
    Transcribe audio stream in real-time
    Used for live consultation recording
    """
    try:
        audio_chunk = request.files.get('audio_chunk')
        language = request.form.get('language', 'hi')
        
        if not audio_chunk:
            return jsonify({'error': 'No audio chunk provided'}), 400
        
        # Save chunk to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_chunk.save(temp_audio.name)
            temp_audio_path = temp_audio.name
        
        try:
            # Quick transcription for real-time feedback
            result = model.transcribe(
                temp_audio_path,
                language=language,
                task='transcribe',
                fp16=False,
                beam_size=1,  # Faster but slightly less accurate
                best_of=1
            )
            
            return jsonify({
                'success': True,
                'text': result['text'],
                'language': result.get('language', language)
            })
        
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
    
    except Exception as e:
        logger.error(f'Stream transcription error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/detect-language', methods=['POST'])
def detect_language():
    """
    Detect language from audio sample
    Useful for automatic language detection
    """
    try:
        audio_file = request.files.get('audio')
        
        if not audio_file:
            return jsonify({'error': 'No audio file provided'}), 400
        
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio:
            audio_file.save(temp_audio.name)
            temp_audio_path = temp_audio.name
        
        try:
            # Load audio
            audio = whisper.load_audio(temp_audio_path)
            audio = whisper.pad_or_trim(audio)
            
            # Detect language
            mel = whisper.log_mel_spectrogram(audio).to(model.device)
            _, probs = model.detect_language(mel)
            
            detected_language = max(probs, key=probs.get)
            confidence = probs[detected_language]
            
            return jsonify({
                'success': True,
                'language': detected_language,
                'confidence': float(confidence),
                'all_probabilities': {k: float(v) for k, v in probs.items() if v > 0.01}
            })
        
        finally:
            if os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
    
    except Exception as e:
        logger.error(f'Language detection error: {str(e)}')
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    app.run(host='0.0.0.0', port=port, debug=False)