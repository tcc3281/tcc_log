#!/bin/bash
# Script để chạy local development với database Docker

set -e  # Exit on error

echo "🚀 Starting Local Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check required tools
echo -e "${BLUE}📋 Checking required tools...${NC}"

if ! command_exists docker-compose; then
    echo -e "${RED}❌ docker-compose not found. Please install Docker Desktop.${NC}"
    exit 1
fi

if ! command_exists python3 : ! command_exists python; then
    echo -e "${RED}❌ python not found. Please install Python.${NC}"
    exit 1
fi

# Use python3 if available, otherwise python
PYTHON_CMD="python3"
if ! command_exists python3; then
    PYTHON_CMD="python"
fi

# Create .env file if not exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file...${NC}"
    cat > .env << 'EOF'
# Database Configuration (kết nối với PostgreSQL container)
DATABASE_URL=postgresql+psycopg2://postgres:Mayyeutao0?@localhost:5432/postgres

# Backend Configuration
SECRET_KEY=hZKxcKs2I92_s90ZVQNw4MF3BI1qKFFI-2PwhK8OlRM
ACCESS_TOKEN_EXPIRE_MINUTES=30
RUN_MIGRATIONS=true
SEED_DATA=false

# CORS Configuration
ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# AI Configuration (LM Studio)
LM_STUDIO_BASE_URL=http://127.0.0.1:1234/v1
LM_STUDIO_MODEL=your-model-identifier

# Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# Development Settings
DEBUG=true
EOF
    echo -e "${GREEN}✅ .env file created${NC}"
fi

# Start database container
echo -e "${BLUE}🐘 Starting PostgreSQL database...${NC}"
docker-compose up db -d

# Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database to be ready...${NC}"
sleep 5

# Check if database is running
if docker-compose ps db | grep -q "Up"; then
    echo -e "${GREEN}✅ Database is running${NC}"
else
    echo -e "${RED}❌ Database failed to start${NC}"
    docker-compose logs db
    exit 1
fi

# Install Python dependencies
echo -e "${BLUE}📦 Installing Python dependencies...${NC}"
$PYTHON_CMD -m pip install --upgrade pip
$PYTHON_CMD -m pip install -r requirements.txt

echo -e "${GREEN}✅ Dependencies installed successfully${NC}"

# Show connection info
echo -e "\n${CYAN}🔗 Database Connection Info:${NC}"
echo -e "   ${WHITE}Host: localhost${NC}"
echo -e "   ${WHITE}Port: 5432${NC}"
echo -e "   ${WHITE}Database: postgres${NC}"
echo -e "   ${WHITE}Username: postgres${NC}"
echo -e "   ${WHITE}Password: Mayyeutao0?${NC}"

echo -e "\n${GREEN}🎯 Ready to start backend!${NC}"
echo -e "${YELLOW}Run: $PYTHON_CMD run_backend.py${NC}"

# Ask if user wants to start backend automatically
echo -e "\nDo you want to start the backend now? (y/N)"
read -r startBackend
if [[ $startBackend =~ ^[Yy]$ ]]; then
    echo -e "\n${GREEN}🔥 Starting backend server...${NC}"
    $PYTHON_CMD run_backend.py
else
    echo -e "\n${BLUE}📝 To start backend later, run:${NC}"
    echo -e "   ${WHITE}$PYTHON_CMD run_backend.py${NC}"
    echo -e "\n${BLUE}📝 To start frontend (optional), run:${NC}"
    echo -e "   ${WHITE}cd frontend : npm install : npm run dev${NC}"
    echo -e "\n${BLUE}📝 To stop database:${NC}"
    echo -e "   ${WHITE}docker-compose stop db${NC}"
fi 