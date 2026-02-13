@echo off
REM ========================================================================
REM NearO AWS EC2 Deployment Helper (Windows)
REM Run this to prepare the deployment package
REM ========================================================================

setlocal enabledelayedexpansion
cd /d "%~dp0"

echo.
echo ======================================================================
echo  NearO AWS EC2 Deployment Helper - Windows
echo ======================================================================
echo.

REM Get instance details
set /p INSTANCE_ID="Enter EC2 Instance ID (e.g., i-025cc8a85dd4f60f9): "
set /p PUBLIC_IP="Enter EC2 Public IP (e.g., 13.222.33.156): "
set /p KEY_FILE="Enter path to your .pem key file (e.g., C:\keys\my-key.pem): "

echo.
echo Instance ID: %INSTANCE_ID%
echo Public IP: %PUBLIC_IP%
echo.

REM Check if SSH key exists
if not exist "%KEY_FILE%" (
    echo ERROR: Key file not found at %KEY_FILE%
    pause
    exit /b 1
)

echo.
echo ======================================================================
echo  DEPLOYMENT INSTRUCTIONS
echo ======================================================================
echo.
echo 1. CONNECT TO YOUR EC2 INSTANCE via SSH:
echo.
echo    ssh -i "%KEY_FILE%" ec2-user@%PUBLIC_IP%
echo.
echo 2. Inside the EC2 instance, run these commands:
echo.
echo    cd /home/ec2-user
echo    git clone https://github.com/mwasiq11/NearO.git
echo    cd NearO
echo    chmod +x deploy-to-ec2.sh
echo    sudo ./deploy-to-ec2.sh
echo.
echo 3. Wait for deployment to complete (5-10 minutes)
echo.
echo 4. Access your application:
echo.
echo    Frontend: http://%PUBLIC_IP%:8080
echo    API:      http://%PUBLIC_IP%:3000
echo.
echo ======================================================================
echo.

REM Optional: Create a connection script
echo.
set /p CREATE_SCRIPT="Would you like to create a quick connection script? (Y/N): "

if /i "%CREATE_SCRIPT%"=="Y" (
    (
        @echo off
        title NearO EC2 Connection
        ssh -i "%KEY_FILE%" ec2-user@%PUBLIC_IP%
        pause
    ) > ec2-connect.bat
    echo.
    echo ✓ Created ec2-connect.bat - Double-click to connect to your instance
)

echo.
echo ======================================================================
echo  IMPORTANT: AWS Security Group Configuration
echo ======================================================================
echo.
echo Make sure your EC2 Security Group allows:
echo   - Port 22 (SSH)          - for deployment
echo   - Port 3000 (API)        - for backend
echo   - Port 8080 (Frontend)   - for web app
echo   - Port 3306 (MySQL)      - internal only (optional)
echo   - Port 6379 (Redis)      - internal only (optional)
echo.
echo To configure in AWS Console:
echo   1. Go to EC2 Dashboard
echo   2. Select your instance
echo   3. Click Security Groups
echo   4. Edit inbound rules
echo   5. Add rules for ports above
echo.
echo ======================================================================
echo.
pause
