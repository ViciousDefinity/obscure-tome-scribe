@echo off
title D&D Campaign Manager Work Session

:: Open Frontend Tab
start "Frontend" cmd /k "cd /d C:\Users\vicio\dnd_campaign_manager\frontend && echo Frontend Ready"

:: Open Backend Tab
start "Backend" cmd /k "cd /d C:\Users\vicio\dnd_campaign_manager\backend && echo Backend Ready"

exit