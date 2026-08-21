@echo off
cd /d "%~dp0"

set NODE_OPTIONS=--use-system-ca
set npm_config_cache=%~dp0.npm-cache
set LOG_FILE=%~dp0gas-upload-last.log

echo =====================================
echo GAS UPLOAD TO GOOGLE
echo clasp push
echo =====================================
echo.
echo This uploads local GAS files to Google Apps Script.
echo Please confirm that git status is expected before continuing.
echo.
echo Log file: %LOG_FILE%
echo.

git status --short

echo.
set /p confirm=Upload with clasp push? Type YES: 

if not "%confirm%"=="YES" (
  echo Upload cancelled.
  pause
  exit /b 1
)

echo ===================================== > "%LOG_FILE%"
echo GAS UPLOAD START %DATE% %TIME% >> "%LOG_FILE%"
echo ===================================== >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

npm.cmd run push >> "%LOG_FILE%" 2>&1

echo.
echo =====================================
echo CLASP PUSH OUTPUT
echo =====================================
type "%LOG_FILE%"

if errorlevel 1 (
  echo.
  echo =====================================
  echo UPLOAD FAILED
  echo =====================================
  echo clasp push failed. Please check the error message above.
  echo.
  pause
  exit /b 1
)

echo.
echo =====================================
echo UPLOAD SUCCESS
echo =====================================
echo Local GAS files were uploaded to Google Apps Script.

echo.
echo =====================================
echo GIT STATUS AFTER UPLOAD
echo =====================================
git status --short

pause
