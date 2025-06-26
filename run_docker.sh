#!/bin/bash

# Stop any running containers
echo "Stopping any existing containers..."
docker-compose down

# Build the images with no cache to ensure fresh builds
echo "Building Docker images..."
docker-compose build --no-cache

# Start the containers
echo "Starting containers..."
docker-compose up -d

# Wait for the backend to be ready
echo "Waiting for backend to be ready..."
sleep 10

# Run migrations
echo "Running database migrations..."
docker-compose exec backend python -m alembic upgrade head

echo "Application is running!"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
