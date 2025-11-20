@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'node' -ArgumentList 'index.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
