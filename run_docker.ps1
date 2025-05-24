# Stop any running containers
Write-Host "Stopping any existing containers..." -ForegroundColor Green
docker-compose down

# Build the images with no cache to ensure fresh builds
Write-Host "Building Docker images..." -ForegroundColor Green
docker-compose build --no-cache

# Start the containers
Write-Host "Starting containers..." -ForegroundColor Green
docker-compose up -d

# Wait for the backend to be ready
Write-Host "Waiting for backend to be ready..." -ForegroundColor Green
Start-Sleep -Seconds 10

# Run migrations
Write-Host "Running database migrations..." -ForegroundColor Green
docker-compose exec backend python -m alembic upgrade head

Write-Host "Application is running!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Cyan
