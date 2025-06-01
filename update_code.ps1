# Script để cập nhật code trong container mà không rebuild
param (
    [switch]$Backend = $false,
    [switch]$Frontend = $false,
    [switch]$All = $true,
    [switch]$ClearCache = $false
)

# Nếu không có tham số nào được chỉ định, mặc định là cập nhật tất cả
if (-not $Backend -and -not $Frontend) {
    $All = $true
}

# Kiểm tra xem containers có đang chạy không
function Check-ContainerRunning {
    param (
        [string]$containerName
    )
    $status = docker ps --filter "name=$containerName" --filter "status=running" --format "{{.Names}}"
    return $status -eq $containerName
}

Write-Host "Checking container status..." -ForegroundColor Blue
$backendRunning = Check-ContainerRunning -containerName "tcc_log-backend-1"
$frontendRunning = Check-ContainerRunning -containerName "tcc_log-frontend-1"

if (-not $backendRunning -and ($Backend -or $All)) {
    Write-Host "Warning: Backend container is not running. Skipping backend update." -ForegroundColor Yellow
    $Backend = $false
}

if (-not $frontendRunning -and ($Frontend -or $All)) {
    Write-Host "Warning: Frontend container is not running. Skipping frontend update." -ForegroundColor Yellow
    $Frontend = $false
}

Write-Host "Copying updated files to containers..." -ForegroundColor Green

# Cập nhật backend code
if ($Backend -or $All) {
    try {
        Write-Host "Updating backend code..." -ForegroundColor Cyan
        docker cp ./app tcc_log-backend-1:/app/
        docker cp ./alembic tcc_log-backend-1:/app/
        Write-Host "Backend code updated successfully." -ForegroundColor Green
    } catch {
        Write-Host "Error updating backend code: $_" -ForegroundColor Red
    }
}

# Cập nhật frontend code
if ($Frontend -or $All) {
    try {
        Write-Host "Updating frontend code..." -ForegroundColor Cyan
        docker cp ./frontend tcc_log-frontend-1:/app/
        
        if ($ClearCache) {
            Write-Host "Clearing Next.js cache..." -ForegroundColor Cyan
            docker exec tcc_log-frontend-1 rm -rf .next/cache
        }
        
        Write-Host "Frontend code updated successfully." -ForegroundColor Green
    } catch {
        Write-Host "Error updating frontend code: $_" -ForegroundColor Red
    }
}

# Restart services
Write-Host "Restarting services..." -ForegroundColor Green
if ($Backend -or $All) {
    docker-compose restart backend
}
if ($Frontend -or $All) {
    docker-compose restart frontend
}

Write-Host "`nCode update complete!" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:8000" -ForegroundColor Cyan
Write-Host "- Backend Docs: http://localhost:8000/docs" -ForegroundColor Cyan

Write-Host "`nUsage tips:" -ForegroundColor Yellow
Write-Host "  To update only backend:    .\update_code.ps1 -Backend" -ForegroundColor Gray
Write-Host "  To update only frontend:   .\update_code.ps1 -Frontend" -ForegroundColor Gray
Write-Host "  To clear NextJS cache:     .\update_code.ps1 -Frontend -ClearCache" -ForegroundColor Gray
Write-Host "  To update everything:      .\update_code.ps1 -All" -ForegroundColor Gray
