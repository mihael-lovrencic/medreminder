@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\npx.cmd" http-server -p 8080 -c-1
pause
