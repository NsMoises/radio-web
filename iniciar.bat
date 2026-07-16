@echo off
chcp 65001 >nul 2>nul
title Radio Online - Servidor de desarrollo
cd /d "%~dp0"

echo ============================================
echo   Radio Online - Arranque del servidor
echo ============================================
echo.
echo  NOTA: Las APIs funcionan via localStorage en desarrollo.
echo  En produccion (cPanel) usan PHP automaticamente.
echo.

if exist "node_modules" goto :rundev

echo [1/2] Instalando dependencias (primera vez)...
call npm install
if errorlevel 1 goto :errorinstall
echo.
echo [1/2] Dependencias instaladas correctamente.
goto :rundev

:errorinstall
echo.
echo ERROR: fallo al instalar dependencias.
echo Verifica que Node.js este instalado: https://nodejs.org
echo.
pause
exit /b 1

:rundev
echo [2/2] Arrancando Vite en http://localhost:5173
echo      Pulsa Ctrl+C para detener el servidor.
echo.
echo  Si tienes PHP instalado, abre OTRA terminal y ejecuta:
echo    php -S localhost:8080 -t public/api
echo.
call npm run dev
pause