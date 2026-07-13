@echo off
title AXIOM Stopper
color 0C
echo Stopping all AXIOM services...
echo.
taskkill /FI "WINDOWTITLE eq 1-OPCUA-SERVER*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq 2-BRIDGE*"        /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq 3-TUNNEL*"        /T /F >nul 2>&1
echo  All services stopped.
echo.
pause
