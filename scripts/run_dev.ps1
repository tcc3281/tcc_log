# This PowerShell script starts the backend and frontend development servers for local development.
# Usage: Right-click and select 'Run with PowerShell' or run from a PowerShell terminal.

Write-Host "Starting backend (python run_backend.py)..." -ForegroundColor Green
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'python run_backend.py' -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host "Starting frontend (npm install & npm run dev in ./frontend)..." -ForegroundColor Green
Push-Location frontend
npm install
Start-Process powershell -ArgumentList '-NoExit', '-Command', 'npm run dev' -WindowStyle Normal
Pop-Location

Write-Host "\nBoth backend and frontend dev servers have been started in new PowerShell windows." -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:8000" -ForegroundColor Yellow
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Yellow
