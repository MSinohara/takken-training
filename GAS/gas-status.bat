@echo off
cd /d "%~dp0"

set NODE_OPTIONS=--use-system-ca
set npm_config_cache=%~dp0.npm-cache

echo =====================================
echo GAS CLASP STATUS
echo =====================================
npm.cmd run status

echo.
echo =====================================
echo GIT STATUS
echo =====================================
git status --short

pause
