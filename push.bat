@echo off
cd /d "%~dp0"
echo ==============================================
echo  Kids English GitHub and Vercel Git Push Helper
echo ==============================================
echo.
git add .
set /p commit_msg="커밋 메시지를 입력하세요 (기본값: Update daily english): "
if "%commit_msg%"=="" set commit_msg=Update daily english
git commit -m "%commit_msg%"
echo.
echo Pushing latest commits to GitHub...
git push -u origin main
pause
