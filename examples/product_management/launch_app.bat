@echo off
chcp 65001 > nul
title Lolpaon Store Pro - Application LLP
echo ===================================================
echo   Lancement de l'Application Graphique Interactive
echo   Lolpaon Store Pro (.cllpdb + .illp)
echo ===================================================
echo.
cd /d "%~dp0..\.."
node bin\llp.js app examples\product_management
