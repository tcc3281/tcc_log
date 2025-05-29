#!/usr/bin/env pwsh
# Script để dừng local development environment

Write-Host "🛑 Stopping Local Development Environment..." -ForegroundColor Red

# Stop database container
Write-Host "🐘 Stopping PostgreSQL database..." -ForegroundColor Blue
docker-compose stop db

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database stopped successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to stop database" -ForegroundColor Red
}

# Show status
Write-Host "`n📊 Container Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n📝 Commands for cleanup:" -ForegroundColor Blue
Write-Host "   Remove containers: docker-compose down" -ForegroundColor White
Write-Host "   Remove volumes (delete data): docker-compose down -v" -ForegroundColor White
Write-Host "   Remove everything: docker-compose down -v --remove-orphans" -ForegroundColor White

$cleanup = Read-Host "`nDo you want to remove containers and data? (y/N)"
if ($cleanup -eq "y" -or $cleanup -eq "Y") {
    Write-Host "🗑️ Removing containers and volumes..." -ForegroundColor Yellow
    docker-compose down -v
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
} 