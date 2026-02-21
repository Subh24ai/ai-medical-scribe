# AI Medical Scribe - API Documentation

Base URL: `http://localhost:5000/api/v1`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

### Register Doctor
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Dr. Rajesh Kumar",
  "email": "rajesh@clinic.com",
  "password": "securepassword",
  "phone": "+919876543210",
  "registrationNumber": "MCI123456",
  "specialization": "General Physician",
  "clinicId": "clinic-uuid"
}

Response: 201 Created
{
  "success": true,
  "message": "Doctor registered successfully",
  "data": {
    "token": "jwt-token",
    "doctor": {
      "id": "uuid",
      "name": "Dr. Rajesh Kumar",
      "email": "rajesh@clinic.com",
      "role": "doctor"
    }
  }
}
```

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "rajesh@clinic.com",
  "password": "securepassword"
}

Response: 200 OK
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "doctor": { ... }
  }
}
```

## Patients

### Create Patient
```http
POST /patients
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Amit Sharma",
  "age": 35,
  "gender": "Male",
  "phone": "+919876543210",
  "email": "amit@email.com",
  "address": "123 MG Road, Mumbai",
  "bloodGroup": "O+",
  "allergies": ["Penicillin"],
  "chronicConditions": ["Hypertension"],
  "preferredLanguage": "hi"
}

Response: 201 Created
{
  "success": true,
  "message": "Patient created successfully",
  "data": {
    "patient": {
      "id": "uuid",
      "patientId": "PAT-2024-001",
      "name": "Amit Sharma",
      ...
    }
  }
}
```

### Get All Patients
```http
GET /patients?page=1&limit=10&search=Amit
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "patients": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

### Get Patient by ID
```http
GET /patients/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "patient": { ... }
  }
}
```

## Consultations

### Start Consultation
```http
POST /consultations
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientId": "patient-uuid"
}

Response: 201 Created
{
  "success": true,
  "message": "Consultation started",
  "data": {
    "consultation": {
      "id": "consultation-uuid",
      "patientId": "patient-uuid",
      "doctorId": "doctor-uuid",
      "status": "in_progress",
      "consultationDate": "2024-02-08T10:30:00Z"
    }
  }
}
```

### Process Transcription
```http
POST /consultations/:id/process-transcription
Authorization: Bearer <token>
Content-Type: application/json

{
  "transcription": "Patient complaining of fever for 3 days...",
  "audioUrl": "s3://bucket/audio.mp3"
}

Response: 200 OK
{
  "success": true,
  "message": "Transcription processed successfully",
  "data": {
    "consultation": { ... },
    "aiSuggestions": {
      "chiefComplaint": "Fever for 3 days",
      "diagnosis": "Viral fever",
      "medicines": [
        {
          "name": "Paracetamol",
          "dosage": "500mg",
          "frequency": "3 times daily",
          "duration": "5 days"
        }
      ],
      "vitals": {
        "temperature": "101°F"
      }
    }
  }
}
```

### Update Consultation
```http
PUT /consultations/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "chiefComplaint": "Fever and headache",
  "diagnosis": "Viral infection",
  "vitals": {
    "bp": "120/80",
    "pulse": "80",
    "temperature": "101"
  }
}

Response: 200 OK
```

### Complete Consultation
```http
POST /consultations/:id/complete
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Consultation completed"
}
```

## Prescriptions

### Create Prescription
```http
POST /prescriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "consultation-uuid",
  "patientId": "patient-uuid",
  "medicines": [
    {
      "name": "Paracetamol",
      "dosage": "500mg",
      "frequency": "3 times daily",
      "duration": "5 days",
      "instructions": "Take after meals"
    }
  ],
  "labTests": ["CBC", "ESR"],
  "advice": "Rest and drink plenty of fluids",
  "followUpInstructions": "Follow up if fever persists after 3 days"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "prescription": {
      "id": "prescription-uuid",
      "prescriptionNumber": "RX-2024-001",
      "status": "draft"
    }
  }
}
```

### Finalize Prescription
```http
POST /prescriptions/:id/finalize
Authorization: Bearer <token>
Content-Type: application/json

{
  "patientLanguage": "hi"
}

Response: 200 OK
{
  "success": true,
  "message": "Prescription finalized",
  "data": {
    "prescription": {
      "status": "finalized",
      "pdfUrl": "/uploads/prescriptions/prescription-123.pdf",
      "patientExplanation": {
        "explanation": "आपको वायरल बुखार है...",
        "medicineInstructions": [...],
        "precautions": [...]
      }
    }
  }
}
```

### Send Prescription to Patient
```http
POST /prescriptions/:id/send
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Prescription sent to patient"
}
```

## Payments

### Create Payment
```http
POST /payments/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "consultationId": "consultation-uuid",
  "patientId": "patient-uuid",
  "amount": 500,
  "paymentMethod": "UPI"
}

Response: 201 Created
{
  "success": true,
  "data": {
    "payment": {
      "id": "payment-uuid",
      "receiptNumber": "REC-2024-001",
      "razorpayOrderId": "order_123"
    }
  }
}
```

### Verify Payment
```http
POST /payments/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "razorpayOrderId": "order_123",
  "razorpayPaymentId": "pay_123",
  "razorpaySignature": "signature_hash"
}

Response: 200 OK
{
  "success": true,
  "message": "Payment verified successfully"
}
```

## Analytics

### Dashboard Stats
```http
GET /analytics/dashboard
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "data": {
    "todayConsultations": 12,
    "todayRevenue": 6000,
    "totalPatients": 150,
    "pendingConsultations": 3,
    "recentConsultations": [...],
    "monthlyRevenue": [...]
  }
}
```

## WebSocket Events

Connect to: `ws://localhost:5000`

### Events

**Client → Server:**
- `start-consultation`: Start listening for consultation updates
  ```javascript
  socket.emit('start-consultation', { consultationId: 'uuid' });
  ```

- `audio-chunk`: Send audio chunk for real-time transcription
  ```javascript
  socket.emit('audio-chunk', {
    consultationId: 'uuid',
    audioData: base64Data,
    speaker: 'doctor'
  });
  ```

**Server → Client:**
- `consultation-started`: Consultation has started
  ```javascript
  socket.on('consultation-started', (data) => {
    // { consultationId, patientName }
  });
  ```

- `transcription-update`: New transcription available
  ```javascript
  socket.on('transcription-update', (data) => {
    // { text, speaker, timestamp }
  });
  ```

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

### Common Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

## Rate Limiting

- Rate limit: 100 requests per 15 minutes
- Exceeding limit returns `429 Too Many Requests`

## Pagination

List endpoints support pagination:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (default: createdAt)
- `order`: Sort order (asc/desc, default: desc)

## Search & Filtering

- `search`: Search across multiple fields
- `status`: Filter by status
- `startDate`, `endDate`: Date range filter
- `doctorId`: Filter by doctor
- `patientId`: Filter by patient