# Script để build Docker với BuildKit
Write-Host "Building with Docker BuildKit for better caching and performance..." -ForegroundColor Green

# Kích hoạt BuildKit
$env:DOCKER_BUILDKIT=1

# Build images với BuildKit
docker-compose build

# Khởi động containers
docker-compose up -d

Write-Host "`nApplication is running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan
