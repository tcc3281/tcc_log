#!/usr/bin/env pwsh
# Script đơn giản để chạy local development với database Docker

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

# Create simple .env file if not exists
if (-not (Test-Path ".env")) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @(
        "DATABASE_URL=postgresql+psycopg2://postgres:Mayyeutao0?@localhost:5432/postgres",
        "SECRET_KEY=hZKxcKs2I92_s90ZVQNw4MF3BI1qKFFI-2PwhK8OlRM",
        "ACCESS_TOKEN_EXPIRE_MINUTES=30",
        "RUN_MIGRATIONS=true",
        "SEED_DATA=false",
        "ADDITIONAL_CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000",
        "DEBUG=true"
    )
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
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
Write-Host ""
Write-Host "🔗 Database Connection Info:" -ForegroundColor Cyan
Write-Host "   Host: localhost" -ForegroundColor White
Write-Host "   Port: 5432" -ForegroundColor White
Write-Host "   Database: postgres" -ForegroundColor White
Write-Host "   Username: postgres" -ForegroundColor White
Write-Host "   Password: Mayyeutao0?" -ForegroundColor White

Write-Host ""
Write-Host "🎯 Ready to start backend!" -ForegroundColor Green
Write-Host "Run: python run_backend.py" -ForegroundColor Yellow

# Ask if user wants to start backend automatically
Write-Host ""
$startBackend = Read-Host "Do you want to start the backend now? (y/N)"
if ($startBackend -eq "y" -or $startBackend -eq "Y") {
    Write-Host ""
    Write-Host "🔥 Starting backend server..." -ForegroundColor Green
    python run_backend.py
} else {
    Write-Host ""
    Write-Host "📝 To start backend later, run:" -ForegroundColor Blue
    Write-Host "   python run_backend.py" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 To start frontend (optional), run:" -ForegroundColor Blue
    Write-Host "   cd frontend" -ForegroundColor White
    Write-Host "   npm install" -ForegroundColor White
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "📝 To stop database:" -ForegroundColor Blue
    Write-Host "   docker-compose stop db" -ForegroundColor White
} 