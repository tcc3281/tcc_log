#!/usr/bin/env pwsh
# Script để chạy local development với database Docker

Write-Host "🚀 Starting Local Development Environment..." -ForegroundColor Green

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check required tools
Write-Host "📋 Checking required tools..." -ForegroundColor Blue

if (-not (Test-Command "docker-compose")) {
    Write-Host "❌ docker-compose not found. Please install Docker Desktop." -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "python")) {
    Write-Host "❌ python not found. Please install Python." -ForegroundColor Red
    exit 1
}

# Create .env file if not exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
# Database Configuration (kết nối với PostgreSQL container)
DATABASE_URL=postgresql+psycopg2://postgres:Mayyeutao0?@locacdlhost:5432/postgres

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
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
}

# Start database container
Write-Host "🐘 Starting PostgreSQL database..." -ForegroundColor Blue
docker-compose up db -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start database container" -ForegroundColor Red
    exit 1
}

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if database is running
$dbStatus = docker-compose ps db --format "table {{.Status}}"
if ($dbStatus -like "*Up*") {
    Write-Host "✅ Database is running" -ForegroundColor Green
} else {
    Write-Host "❌ Database failed to start" -ForegroundColor Red
    docker-compose logs db
    exit 1
}

# Install Python dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Blue
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green

# Show connection info
Write-Host "`n🔗 Database Connection Info:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: postgres" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: Mayyeutao0?" -ForegroundColor White

Write-Host "`n🎯 Ready to start backend!" -ForegroundColor Green
Write-Host "Run: python run_backend.py" -ForegroundColor Yellow

# Ask if user wants to start backend automatically
$startBackend = Read-Host "`nDo you want to start the backend now? (y/N)"
if ($startBackend -eq "y" -or $startBackend -eq "Y") {
    Write-Host "`n🔥 Starting backend server..." -ForegroundColor Green
    python run_backend.py
} else {
    Write-Host "`n📝 To start backend later, run:" -ForegroundColor Blue
    Write-Host "   python run_backend.py" -ForegroundColor White
    Write-Host "`n📝 To start frontend (optional), run:" -ForegroundColor Blue
    Write-Host "   cd frontend; npm install; npm run dev" -ForegroundColor White
    Write-Host "`n📝 To stop database:" -ForegroundColor Blue
    Write-Host "   docker-compose stop db" -ForegroundColor White
} 