# =============================================================================
# TCC LOG - AI-POWERED LEARNING JOURNAL
# PowerShell Build Script for Windows Development
# =============================================================================

param(
    [Parameter(Position=0)]
    [string]$Command = "help",
    [string]$Message = "",
    [string]$BackupFile = ""
)

# Project variables
$PYTHON = "python"
$PIP = "pip"
$PROJECT_NAME = "tcc_log"
$BACKEND_DIR = "."
$FRONTEND_DIR = "frontend"

function Write-Info($msg) {
    Write-Host $msg -ForegroundColor Blue
}

function Write-Success($msg) {
    Write-Host $msg -ForegroundColor Green
}

function Write-Warning($msg) {
    Write-Host $msg -ForegroundColor Yellow
}

function Write-Error($msg) {
    Write-Host $msg -ForegroundColor Red
}

function Show-Help {
    Write-Host "TCC Log - AI-Powered Learning Journal" -ForegroundColor Cyan
    Write-Host "Available commands:" -ForegroundColor Yellow
    Write-Host ""
    
    Write-Host "  help                 Show this help message" -ForegroundColor Green
    Write-Host "  install              Install production dependencies" -ForegroundColor Green
    Write-Host "  install-dev          Install development dependencies" -ForegroundColor Green
    Write-Host "  install-frontend     Install frontend dependencies" -ForegroundColor Green
    Write-Host "  setup                Set up the development environment" -ForegroundColor Green
    Write-Host "  migrate              Run database migrations" -ForegroundColor Green
    Write-Host "  migrate-create       Create new migration" -ForegroundColor Green
    Write-Host "  seed                 Seed database with sample data" -ForegroundColor Green
    Write-Host "  dev-backend          Start backend development server" -ForegroundColor Green
    Write-Host "  dev-frontend         Start frontend development server" -ForegroundColor Green
    Write-Host "  test                 Run all tests" -ForegroundColor Green
    Write-Host "  test-unit            Run unit tests only" -ForegroundColor Green
    Write-Host "  test-integration     Run integration tests only" -ForegroundColor Green
    Write-Host "  test-coverage        Run tests with coverage report" -ForegroundColor Green
    Write-Host "  lint                 Run linting tools" -ForegroundColor Green
    Write-Host "  format               Format code with black and isort" -ForegroundColor Green
    Write-Host "  clean                Clean up generated files" -ForegroundColor Green
    Write-Host "  health-check         Check application health" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage: .\make.ps1 <command>" -ForegroundColor Yellow
    Write-Host "Example: .\make.ps1 setup" -ForegroundColor Yellow
}

function Install-Production {
    Write-Info "Installing production dependencies..."
    & $PIP install -r requirements.txt
}

function Install-Development {
    Write-Info "Installing development dependencies..."
    & $PYTHON scripts/install_dev_deps.py
}

function Install-Frontend {
    Write-Info "Installing frontend dependencies..."
    if (Test-Path $FRONTEND_DIR) {
        Set-Location $FRONTEND_DIR
        npm install
        Set-Location ..
    } else {
        Write-Warning "Frontend directory not found"
    }
}

function Setup-Environment {
    Write-Info "Setting up development environment..."
    
    if (!(Test-Path ".env")) {
        Write-Warning "Creating .env file from template..."
        Copy-Item "env.example" ".env"
        Write-Error "Please edit .env with your configurations"
    }
    
    Install-Development
    Write-Success "Development environment setup complete!"
}

function Run-Migration {
    Write-Info "Running database migrations..."
    alembic upgrade head
}

function Create-Migration {
    if (!$Message) {
        $Message = Read-Host "Migration message"
    }
    Write-Info "Creating new migration..."
    alembic revision --autogenerate -m $Message
}

function Seed-Database {
    Write-Info "Seeding database with sample data..."
    & $PYTHON -m app.seed_data
}

function Start-Backend {
    Write-Info "Starting backend development server..."
    Write-Info "Backend will be available at http://localhost:8000"
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
}

function Start-Frontend {
    Write-Info "Starting frontend development server..."
    if (Test-Path $FRONTEND_DIR) {
        Set-Location $FRONTEND_DIR
        Write-Info "Frontend will be available at http://localhost:3000"
        npm run dev
        Set-Location ..
    } else {
        Write-Warning "Frontend directory not found"
    }
}

function Run-Tests {
    Write-Info "Running all tests..."
    pytest tests/ -v
}

function Run-UnitTests {
    Write-Info "Running unit tests..."
    pytest tests/unit/ -v
}

function Run-IntegrationTests {
    Write-Info "Running integration tests..."
    pytest tests/integration/ -v
}

function Run-TestCoverage {
    Write-Info "Running tests with coverage..."
    pytest tests/ --cov=app --cov-report=html --cov-report=term
}

function Run-Lint {
    Write-Info "Running linting tools..."
    flake8 app/ tests/
    mypy app/
}

function Format-Code {
    Write-Info "Formatting code..."
    black app/ tests/
    isort app/ tests/
}

function Clean-Files {
    Write-Info "Cleaning up generated files..."
    
    # Remove Python cache files
    try {
        Get-ChildItem -Recurse -Filter "*.pyc" | Remove-Item -Force
        Write-Info "Removed .pyc files"
    } catch {
        Write-Info "No .pyc files found"
    }
    
    # Remove __pycache__ directories
    try {
        Get-ChildItem -Recurse -Directory -Filter "__pycache__" | Remove-Item -Recurse -Force
        Write-Info "Removed __pycache__ directories"
    } catch {
        Write-Info "No __pycache__ directories found"
    }
    
    # Remove pytest cache
    try {
        Get-ChildItem -Recurse -Directory -Filter ".pytest_cache" | Remove-Item -Recurse -Force
        Write-Info "Removed .pytest_cache directories"
    } catch {
        Write-Info "No .pytest_cache directories found"
    }
    
    # Remove specific files/directories if they exist
    $itemsToRemove = @("htmlcov", ".mypy_cache", ".coverage", "test.db")
    foreach ($item in $itemsToRemove) {
        if (Test-Path $item) { 
            Remove-Item $item -Recurse -Force
            Write-Info "Removed $item"
        }
    }
    
    Write-Success "Cleanup complete!"
}

function Check-Health {
    Write-Info "Checking application health..."
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "✅ Backend is responding (Status: $($response.StatusCode))"
    } catch {
        Write-Error "❌ Backend not responding"
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
        Write-Success "✅ Frontend is responding (Status: $($response.StatusCode))"
    } catch {
        Write-Error "❌ Frontend not responding"
    }
}

# Main command dispatcher
switch ($Command.ToLower()) {
    "help" { Show-Help }
    "install" { Install-Production }
    "install-dev" { Install-Development }
    "install-frontend" { Install-Frontend }
    "setup" { Setup-Environment }
    "migrate" { Run-Migration }
    "migrate-create" { Create-Migration }
    "seed" { Seed-Database }
    "dev-backend" { Start-Backend }
    "dev-frontend" { Start-Frontend }
    "test" { Run-Tests }
    "test-unit" { Run-UnitTests }
    "test-integration" { Run-IntegrationTests }
    "test-coverage" { Run-TestCoverage }
    "lint" { Run-Lint }
    "format" { Format-Code }
    "clean" { Clean-Files }
    "health-check" { Check-Health }
    default { 
        Write-Error "Unknown command: $Command"
        Write-Warning "Run '.\make.ps1 help' to see available commands"
    }
}
