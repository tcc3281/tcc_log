# Script to check if the app_uploads volume is working correctly
Write-Host "Checking the app_uploads volume mount..." -ForegroundColor Green

# Create a test file in the backend uploads directory
Write-Host "Creating test file in backend uploads directory..." -ForegroundColor Yellow
docker exec -it tcc_log_backend_1 bash -c "echo 'Test content' > /app/uploads/test_volume_mount.txt && echo 'File created in backend'"

# Check if the file exists in the frontend public/uploads directory
Write-Host "Checking if the file exists in frontend public/uploads directory..." -ForegroundColor Yellow
docker exec -it tcc_log_frontend_1 bash -c "ls -la /app/public/uploads/test_volume_mount.txt || echo 'File NOT found in frontend'"

Write-Host "Volume check complete." -ForegroundColor Green
