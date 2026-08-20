@echo off
title Editor Visual Cacao's Klaus
cd /d "%~dp0"
python server.py
if errorlevel 1 (
    py server.py
)
pause
