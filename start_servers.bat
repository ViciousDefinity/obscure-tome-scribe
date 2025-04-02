@echo off
echo Starting D&D Campaign Manager Servers...

:: Kill all relevant processes and windows
taskkill /F /IM python.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq Django Backend Server" 2>nul
taskkill /F /IM cmd.exe /FI "WINDOWTITLE eq React Frontend Server" 2>nul
taskkill /F /IM powershell.exe /FI "WINDOWTITLE eq React Frontend Server" 2>nul
taskkill /F /IM wt.exe 2>nul

:: Wait briefly to ensure processes terminate
timeout /t 2 /nobreak >nul

:: Start servers in Windows Terminal tabs
wt -w 0 ^
nt cmd /k "title Django Backend Server && cd /d C:\Users\vicio\dnd_campaign_manager\backend && call C:\Users\vicio\dnd_campaign_manager\venv\Scripts\activate && python manage.py runserver" ^
; nt cmd /k "title React Frontend Server && cd /d C:\Users\vicio\dnd_campaign_manager\frontend && cmd /c node_modules\.bin\react-scripts start && title React Frontend Server"

exit