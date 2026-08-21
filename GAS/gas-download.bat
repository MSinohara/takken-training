@echo off
cd /d "%~dp0"

set NODE_OPTIONS=--use-system-ca
set npm_config_cache=%~dp0.npm-cache

echo =====================================
echo GAS DOWNLOAD FROM GOOGLE
echo clasp pull
echo =====================================
npm.cmd run pull

echo.
echo =====================================
echo GIT STATUS AFTER DOWNLOAD
echo =====================================
git status --short

pause
