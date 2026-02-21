#!/bin/bash

# AI Medical Scribe - Automated Setup Script
# This script sets up the development environment

set -e  # Exit on error

echo "=================================="
echo "AI Medical Scribe - Setup Script"
echo "=================================="
echo ""

# Check prerequisites
echo "Checking prerequisites..."

command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Install Node.js 18+"; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "❌ Python 3 is required but not installed. Install Python 3.9+"; exit 1; }
command -v psql >/dev/null 2>&1 || { echo "❌ PostgreSQL is required but not installed. Install PostgreSQL 14+"; exit 1; }
command -v redis-cli >/dev/null 2>&1 || { echo "❌ Redis is required but not installed. Install Redis 7+"; exit 1; }

echo "✅ All prerequisites found!"
echo ""

# Get user input
echo "Please provide configuration details:"
read -p "Database name [medical_scribe]: " DB_NAME
DB_NAME=${DB_NAME:-medical_scribe}

read -p "Database user [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""

read -p "Anthropic API Key: " ANTHROPIC_API_KEY

echo ""
echo "Setting up project..."

# Create database
echo "Creating database..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database might already exist"

# Backend setup
echo ""
echo "Setting up backend..."
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
NODE_ENV=development
PORT=5000
API_VERSION=v1

DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=$(openssl rand -base64 32)
REFRESH_TOKEN_EXPIRES_IN=30d

ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY

AI_SERVICE_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

ENABLE_OFFLINE_MODE=true
ENABLE_CLINICAL_DECISION_SUPPORT=true
ENABLE_DRUG_INTERACTION_CHECK=true
EOF

echo "✅ Backend .env created"

# Run database migrations
echo "Running database migrations..."
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -h localhost -d $DB_NAME -f ../database/schema.sql

echo "✅ Database schema created"

# AI Services setup
echo ""
echo "Setting up AI services..."
cd ../ai-services

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

echo "✅ AI services configured"

# Frontend setup
echo ""
echo "Setting up frontend..."
cd ../frontend-web

npm install

# Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:5000
REACT_APP_BACKEND_URL=http://localhost:5000
EOF

echo "✅ Frontend configured"

cd ..

# Create startup script
cat > start-dev.sh << 'EOFSCRIPT'
#!/bin/bash

echo "Starting AI Medical Scribe..."

# Start Redis
redis-server --daemonize yes

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!

# Start AI services
cd ../ai-services
source venv/bin/activate
python app.py &
AI_PID=$!

# Start frontend
cd ../frontend-web
npm start &
FRONTEND_PID=$!

echo "All services started!"
echo "Backend PID: $BACKEND_PID"
echo "AI Services PID: $AI_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:5000"
echo "AI Services: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for Ctrl+C
trap "kill $BACKEND_PID $AI_PID $FRONTEND_PID; exit" INT
wait
EOFSCRIPT

chmod +x start-dev.sh

echo ""
echo "=================================="
echo "✅ Setup Complete!"
echo "=================================="
echo ""
echo "To start the development environment:"
echo "  ./start-dev.sh"
echo ""
echo "Or manually start each service:"
echo "  Terminal 1: cd backend && npm run dev"
echo "  Terminal 2: cd ai-services && python app.py"
echo "  Terminal 3: cd frontend-web && npm start"
echo ""
echo "Application URLs:"
echo "  Frontend: http://localhost:3000"
echo "  Backend: http://localhost:5000"
echo "  AI Services: http://localhost:8000"
echo ""
echo "Default credentials (create a user via API or frontend):"
echo "  Email: admin@clinic.com"
echo "  Password: (set during registration)"
echo ""