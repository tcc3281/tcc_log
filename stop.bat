@echo off
echo 🛑 Stopping Local Development Environment...

echo 🐘 Stopping PostgreSQL database...
docker-compose stop db

echo.
echo 📊 Container Status:
docker-compose ps

echo.
echo 📝 Commands for cleanup:
echo    Remove containers: docker-compose down
echo    Remove volumes (delete data): docker-compose down -v
echo.

set /p cleanup="Do you want to remove containers and data? (y/N): "
if /i "%cleanup%"=="y" (
    echo 🗑️ Removing containers and volumes...
    docker-compose down -v
    echo ✅ Cleanup completed
)

pause 