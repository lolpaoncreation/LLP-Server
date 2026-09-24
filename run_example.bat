@echo off
chcp 65001 > nul
cd /d "%~dp0"
title LLP Language - Lolpaon Pro

if not "%~1"=="" (
    node bin\llp.js run "%~1"
    pause
    exit /b
)

:menu
cls
echo ===================================================
echo     LLP Language - Lolpaon Programming Language
echo ===================================================
echo.
echo Choisissez une option :
echo   [1] Lancer l'Application Graphique Interactive (GUI Lolpaon Store Pro)
echo   [2] Executer le Script Backend (Product Management main.llp)
echo   [3] Executer la Demo Hierarchie (parent_child_app.llp)
echo   [4] Quitter
echo.
set /p choix="Votre choix (1-4) : "

if "%choix%"=="1" (
    echo.
    echo Lancement de l'application graphique...
    node bin\llp.js app examples\product_management
    pause
    goto menu
)
if "%choix%"=="2" (
    echo.
    echo Execution du script console...
    node bin\llp.js run examples\product_management\src\main.llp
    echo.
    pause
    goto menu
)
if "%choix%"=="3" (
    echo.
    echo Execution de la demo...
    node bin\llp.js run examples\parent_child_app.llp
    echo.
    pause
    goto menu
)
if "%choix%"=="4" (
    exit /b
)
goto menu
