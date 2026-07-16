@echo off
echo ============================================
echo  Iniciando Radio Web (dev con APIs PHP)
echo ============================================
echo.
echo  [1/2] Iniciando servidor PHP para APIs...
start "PHP API" cmd /c "cd /d "%~dp0public\api" && php -S localhost:8080"
timeout /t 2 /nobreak >nul
echo.
echo  [2/2] Iniciando Vite dev server...
echo  Abre http://localhost:5173 en tu navegador
echo.
npx vite
pause
