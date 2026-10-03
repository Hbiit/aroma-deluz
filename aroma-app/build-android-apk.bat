@echo off
echo ========================================================
echo   AROMA DE LUZ - ANDROID APK BUILDER
echo ========================================================
echo.
echo Building Android Standalone APK (Preview Profile)...
echo.
npx eas build -p android --profile preview
echo.
pause
