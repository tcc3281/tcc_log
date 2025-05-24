# Run backend server
Start-Process -NoNewWindow -FilePath "powershell.exe" -ArgumentList "-Command cd d:\chientuhocai\tcc_log && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"

# Wait a moment for the backend to start
Write-Host "Starting backend server..." -ForegroundColor Green
Start-Sleep -Seconds 3

# Run frontend development server
Write-Host "Starting frontend server..." -ForegroundColor Green
Set-Location -Path "d:\chientuhocai\tcc_log\frontend"
npm run dev

# Note: This script keeps the frontend running in the foreground
# The backend is running in a separate window
