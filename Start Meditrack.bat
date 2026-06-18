@echo off
set PATH=C:\Program Files\nodejs;%PATH%
echo Starting Meditrack Server...
start cmd /k "cd server && npm run dev"

echo Starting Meditrack Client...
start cmd /k "cd client && npm run dev"

echo.
echo Both server and client have been started in separate windows.
echo - Server: http://localhost:5000
echo - Client: http://localhost:5173
echo.
pause
