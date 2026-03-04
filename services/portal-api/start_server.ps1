# Start Backend Server
Write-Host "🚀 Starting SmartMLS Backend Server..." -ForegroundColor Green
Write-Host ""

# Activate virtual environment if not already activated
if (-not $env:VIRTUAL_ENV) {
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "..\..\.venv\Scripts\Activate.ps1"
}

# Change to backend directory
Set-Location $PSScriptRoot

# Start uvicorn
Write-Host "Starting Uvicorn on http://localhost:8000..." -ForegroundColor Cyan
Write-Host "Press CTRL+C to stop the server" -ForegroundColor Yellow
Write-Host ""

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000


