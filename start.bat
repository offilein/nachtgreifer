@echo off
echo Starte Nachtgreifer...

:: Docker-Container starten (falls nicht bereits laufend)
docker start nachtgreifer-db >nul 2>&1
echo Datenbank bereit.

:: App starten
npm run dev
