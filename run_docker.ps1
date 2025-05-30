# Stop any running containers
Write-Host "Stopping any existing containers..." -ForegroundColor Green
docker-compose down
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Failed to stop containers, continuing..." -ForegroundColor Yellow
}

# Build the images with no cache to ensure fresh builds
Write-Host "Building Docker images..." -ForegroundColor Green
docker-compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to build Docker images" -ForegroundColor Red
    exit 1
}

# Start the containers
Write-Host "Starting containers..." -ForegroundColor Green
docker-compose up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to start containers" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready and check their health
Write-Host "Waiting for services to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 15

# Check if containers are running
Write-Host "Checking container status..." -ForegroundColor Green
$containers = docker-compose ps --services --filter "status=running"
if ($containers -contains "db" -and $containers -contains "backend" -and $containers -contains "frontend") {
    Write-Host "All services are running successfully!" -ForegroundColor Green
} else {
    Write-Host "Warning: Some services may not be running properly" -ForegroundColor Yellow
    docker-compose ps
}

# Note: Migrations are handled automatically by the backend service (RUN_MIGRATIONS=true)
Write-Host "Note: Database migrations are handled automatically by the backend service" -ForegroundColor Cyan

Write-Host "`nApplication is running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan

# Show logs for debugging if needed
Write-Host "`nTo view logs, use:" -ForegroundColor Yellow
Write-Host "  docker-compose logs -f" -ForegroundColor Gray
Write-Host "To stop services, use:" -ForegroundColor Yellow
Write-Host "  docker-compose down" -ForegroundColor Gray
