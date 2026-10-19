@echo off
title Kids English Worksheet Launcher
echo ============================================================
echo  초등 3~6학년 매일 10분 영어 학습지 시스템 시작 중...
echo ============================================================
echo.

set PROJECT_DIR=%~dp0

echo [1/3] 백엔드 서버(Port 5001)를 실행합니다...
cd /d "%PROJECT_DIR%server"
start "Kids English Backend (Port 5001)" cmd /k "node index.js"

echo [2/3] 프론트엔드 서버(Port 3001)를 실행합니다...
cd /d "%PROJECT_DIR%client"
start "Kids English Frontend (Port 3001)" cmd /k "npm run dev"

echo.
echo [3/3] 잠시 후 브라우저로 학습지 화면(http://localhost:3001)을 엽니다...
timeout /t 3 /nobreak >nul
start http://localhost:3001

echo.
echo ============================================================
echo  학습지 웹사이트가 정상적으로 실행되었습니다!
echo  A4 인쇄(출력)는 상단의 [A4 인쇄하기] 버튼을 누르시면 됩니다.
echo ============================================================
echo.
timeout /t 5
