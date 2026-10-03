@echo off
echo ========================================================
echo   AROMA DE LUZ - IOS APP BUILDER
echo ========================================================
echo.
echo Building iOS App (Simulator / Preview Profile)...
echo.
npx eas build -p ios --profile preview
echo.
pause
