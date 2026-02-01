@echo off
REM docker-build-and-run.bat - Windows Docker setup script

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo NearO Docker Build and Run Script
echo ==========================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
  echo X Docker is not running. Please start Docker Desktop.
  pause
  exit /b 1
)

echo OK Docker is running
echo.

REM Cleanup old containers and volumes
echo Cleaning up old containers and volumes...
docker-compose down -v 2>nul
echo OK Cleanup complete
echo.

REM Build images
echo Building Docker images...
docker-compose build --no-cache
if errorlevel 1 (
  echo X Build failed
  pause
  exit /b 1
)
echo OK Images built successfully
echo.

REM Start services
echo Starting services...
docker-compose up -d
if errorlevel 1 (
  echo X Failed to start services
  pause
  exit /b 1
)
echo OK Services started
echo.

REM Wait for services
echo Waiting for services to be healthy...
timeout /t 15 /nobreak
echo.

REM Show status
echo ==========================================
echo Docker setup complete!
echo ==========================================
echo.
echo Service Status:
docker-compose ps
echo.
echo Access points:
echo   Frontend: http://localhost:8080
echo   API:      http://localhost:3000
echo   MySQL:    localhost:3306
echo   Redis:    localhost:6379
echo.
echo Common commands:
echo   View logs:         docker-compose logs -f
echo   View API logs:     docker-compose logs -f api
echo   Stop services:     docker-compose down
echo   Stop and clean:    docker-compose down -v
echo   Restart API:       docker-compose restart api
echo.
echo Testing:
echo   Test API:     curl http://localhost:3000/health
echo   View API logs: docker-compose logs api
echo.
pause
