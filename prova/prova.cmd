@echo off
setlocal
set "QUI=%~dp0"
set "RADICE=%~dp0.."
set "PHPDIR=%LOCALAPPDATA%\php82"
set "PHP=%PHPDIR%\php.exe"

if not exist "%PHP%" powershell -NoProfile -ExecutionPolicy Bypass -File "%QUI%installa-php.ps1" -Destinazione "%PHPDIR%"
if not exist "%PHP%" (
    echo PHP 8.2 non disponibile in %PHPDIR%.
    exit /b 1
)
"%PHP%" -m | findstr /i /b /c:"sqlsrv" >nul || (
    echo L'estensione sqlsrv non si carica: controlla %PHPDIR%\php.ini e il driver ODBC 18.
    exit /b 1
)

if not exist "%QUI%config.php" node "%RADICE%\tools\genera-config.js" --solo-prova
if not exist "%QUI%config.php" (
    echo Manca prova\config.php.
    exit /b 1
)

if /i "%~1"=="crea" (
    "%PHP%" "%QUI%db_prova.php" crea
    exit /b
)
if /i "%~1"=="azzera" (
    "%PHP%" "%QUI%db_prova.php" azzera
    exit /b
)
if /i "%~1"=="impronta" (
    node "%RADICE%\tools\genera-config.js" --solo-prova --impronta "%~2"
    exit /b
)
if /i "%~1"=="controlla" (
    "%PHP%" "%QUI%db_prova.php" controlla
    exit /b
)

"%PHP%" "%QUI%db_prova.php" controlla || (
    echo Prima crea le copie di prova con: prova\prova.cmd crea
    exit /b 1
)

set "NPSEG_CONFIG=%QUI%config.php"
echo.
echo Banco di prova su http://localhost:8090/NPmonitor/ e http://localhost:8090/NPevo_nearmiss/login.php
echo Tabelle _PROVA, Power Automate spento. Ctrl+C per fermare.
start "" "http://localhost:8090/NPmonitor/"
"%PHP%" -S localhost:8090 -t "%RADICE%"
