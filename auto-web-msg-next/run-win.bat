@echo off
setlocal

set "ROOT=%~dp0"
cd /d "%ROOT%"

set "NODE_VERSION=v24.14.1"
set "CPU_ARCH=%PROCESSOR_ARCHITECTURE%"
if /I "%PROCESSOR_ARCHITEW6432%"=="ARM64" set "CPU_ARCH=ARM64"
if /I "%PROCESSOR_ARCHITEW6432%"=="AMD64" set "CPU_ARCH=AMD64"

if /I "%CPU_ARCH%"=="ARM64" (
  set "NODE_ARCH=arm64"
) else (
  set "NODE_ARCH=x64"
)

set "RUNTIME_DIR=%USERPROFILE%\.auto_web_msg_node"
set "ARCHIVE_NAME=node-%NODE_VERSION%-win-%NODE_ARCH%.zip"
set "ARCHIVE_PATH=%RUNTIME_DIR%\%ARCHIVE_NAME%"
set "EXTRACT_DIR=%RUNTIME_DIR%\node-%NODE_VERSION%-win-%NODE_ARCH%"
set "NODE_EXE=%EXTRACT_DIR%\node.exe"
set "NODE_URL=https://nodejs.org/dist/%NODE_VERSION%/%ARCHIVE_NAME%"

if not exist "%ROOT%start.js" (
  echo [ERROR] start.js not found in project root: %ROOT%
  pause
  exit /b 1
)

if not exist "%RUNTIME_DIR%" (
  mkdir "%RUNTIME_DIR%"
  if errorlevel 1 (
    echo [ERROR] Failed to create runtime directory: %RUNTIME_DIR%
    pause
    exit /b 1
  )
)

if not exist "%ARCHIVE_PATH%" (
  echo [INFO] Downloading Node.js package for %CPU_ARCH%...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { Invoke-WebRequest -Uri '%NODE_URL%' -OutFile '%ARCHIVE_PATH%' -UseBasicParsing; exit 0 } catch { Write-Host $_; exit 1 }"
  if errorlevel 1 (
    echo [ERROR] Failed to download: %NODE_URL%
    pause
    exit /b 1
  )
)

if not exist "%NODE_EXE%" (
  echo [INFO] Extracting Node.js package...
  powershell -NoProfile -ExecutionPolicy Bypass -Command ^
    "try { Expand-Archive -LiteralPath '%ARCHIVE_PATH%' -DestinationPath '%RUNTIME_DIR%' -Force; exit 0 } catch { Write-Host $_; exit 1 }"
  if errorlevel 1 (
    echo [ERROR] Failed to extract archive: %ARCHIVE_PATH%
    pause
    exit /b 1
  )
)

if not exist "%NODE_EXE%" (
  echo [ERROR] Node executable not found after extraction: %NODE_EXE%
  pause
  exit /b 1
)

echo [INFO] Starting app with local Node...
"%NODE_EXE%" "%ROOT%start.js"
if errorlevel 1 (
  echo [ERROR] Application exited with error.
  pause
  exit /b 1
)

endlocal
