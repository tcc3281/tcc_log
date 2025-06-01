# Script để dọn dẹp Docker images không sử dụng và giải phóng bộ nhớ
Write-Host "Cleaning up Docker resources..." -ForegroundColor Green

# Xóa các container đã dừng
Write-Host "Removing stopped containers..." -ForegroundColor Cyan
docker container prune -f

# Xóa các images không có tag
Write-Host "Removing dangling images..." -ForegroundColor Cyan
docker image prune -f

# Xóa các volume không sử dụng (cẩn thận với lệnh này, có thể mất dữ liệu)
# Write-Host "Removing unused volumes..." -ForegroundColor Yellow
# docker volume prune -f

# Hiển thị không gian đĩa đã giải phóng
Write-Host "`nDocker cleanup completed!" -ForegroundColor Green
Write-Host "Current disk usage:" -ForegroundColor Cyan
docker system df
